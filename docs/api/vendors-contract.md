# Vendors API Contract (draft)

Endpoint
- GET /api/vendors

Query params
- category: photography | makeup | catering | decor | (optional, default all)
- tier: economy | mid | premium | (optional, default all)
- city: string (optional)

Response
- 200 OK: { items: Array<{ name: string, category: string, tier: string, city: string }> }

Examples
- Request: /api/vendors?category=photography&tier=mid&city=Ahmedabad
- Response:
```json
{
  "items": [
    { "name": "ShutterLoom Weddings", "category": "photography", "tier": "mid", "city": "Ahmedabad" }
  ]
}
```

Notes
- Pagination/sorting can be added later; for MVP a single page is fine