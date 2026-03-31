import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.43.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY')

    if (!anthropicKey) {
      return new Response(JSON.stringify({ error: 'Anthropic API key not configured' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabaseUser = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    })
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

    const { data: { user }, error: authError } = await supabaseUser.auth.getUser()
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { vendor_id, session_id, message } = await req.json()

    if (!vendor_id || !message) {
      return new Response(JSON.stringify({ error: 'vendor_id and message are required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    let currentSessionId = session_id
    if (!currentSessionId) {
      const { data: newSession, error: sessErr } = await supabaseAdmin
        .from('chat_sessions')
        .insert({ vendor_id, customer_id: user.id })
        .select('id')
        .single()
      if (sessErr) {
        return new Response(JSON.stringify({ error: 'Failed to create session' }), {
          status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      currentSessionId = newSession.id
    }

    const [
      { data: vendor },
      { data: packages },
      { data: documents },
    ] = await Promise.all([
      supabaseAdmin.from('vendor_listings').select('name, category, city, tier, price_range, bio').eq('id', vendor_id).single(),
      supabaseAdmin.from('packages').select('name, description, price_label, duration').eq('vendor_id', vendor_id).order('display_order'),
      supabaseAdmin.from('vendor_documents').select('type, text_content, filename').eq('vendor_id', vendor_id),
    ])

    if (!vendor) {
      return new Response(JSON.stringify({ error: 'Vendor not found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    let systemPrompt = `You are a helpful AI assistant for "${vendor.name}", a ${vendor.category} vendor based in ${vendor.city}.

Your job is to answer customer questions about this vendor's services, pricing, packages, and availability using ONLY the information provided below. Be friendly, concise, and helpful.

RULES:
- Only use the information provided. Do not make up details.
- If you don't have enough information to answer, say "I don't have that specific information. You can send a direct enquiry to ${vendor.name} for details."
- Keep responses under 150 words unless the question requires more detail.
- Be warm and professional — you represent this vendor.
- Do not discuss other vendors or competitors.

## Vendor Profile
- Name: ${vendor.name}
- Category: ${vendor.category}
- City: ${vendor.city}
- Tier: ${vendor.tier || 'Not specified'}
- Price Range: ${vendor.price_range || 'Not specified'}
- About: ${vendor.bio || 'No description available'}`

    if (packages && packages.length > 0) {
      systemPrompt += '\n\n## Service Packages'
      for (const pkg of packages) {
        systemPrompt += `\n- ${pkg.name}: ${pkg.description || 'No description'} | Price: ${pkg.price_label || 'Contact for pricing'} | Duration: ${pkg.duration || 'Not specified'}`
      }
    }

    const notes = (documents || []).filter((d: any) => d.type === 'note' && d.text_content)
    const pdfs = (documents || []).filter((d: any) => d.type === 'pdf' && d.text_content)
    if (notes.length > 0 || pdfs.length > 0) {
      systemPrompt += '\n\n## Additional Information'
      for (const note of notes) {
        systemPrompt += `\n${note.text_content}`
      }
      for (const pdf of pdfs) {
        systemPrompt += `\n[From ${pdf.filename}]: ${pdf.text_content}`
      }
    }

    const { data: history } = await supabaseAdmin
      .from('chat_messages')
      .select('role, content')
      .eq('session_id', currentSessionId)
      .order('created_at', { ascending: true })
      .limit(20)

    const messages = (history || []).map((m: any) => ({
      role: m.role === 'customer' ? 'user' : 'assistant',
      content: m.content,
    }))
    messages.push({ role: 'user', content: message })

    const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 512,
        system: systemPrompt,
        messages,
      }),
    })

    if (!anthropicResponse.ok) {
      const errBody = await anthropicResponse.text()
      console.error('Anthropic API error:', errBody)
      return new Response(JSON.stringify({ error: 'AI service temporarily unavailable' }), {
        status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const aiResult = await anthropicResponse.json()
    const aiResponse = aiResult.content?.[0]?.text || 'Sorry, I could not generate a response.'

    await supabaseAdmin.from('chat_messages').insert([
      { session_id: currentSessionId, role: 'customer', content: message },
      { session_id: currentSessionId, role: 'assistant', content: aiResponse },
    ])

    return new Response(JSON.stringify({ session_id: currentSessionId, response: aiResponse }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (err) {
    console.error('Edge function error:', err)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
