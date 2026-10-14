---
description: Read widget data and manage ProductReels over the WordPress REST API.
---

# REST API

All routes live under the namespace:

```
/wp-json/productreels/v1
```

## Authentication and permissions

| Level | Who | Used by |
| --- | --- | --- |
| **Public read** | Anyone while **Allow public fetch** is on. When it's off, only requests carrying a valid REST nonce, which means your own pages. | Render routes, product batch |
| **Place** | Users with `edit_posts` or `manage_options` | Listing widgets in the block and Elementor pickers |
| **Admin** | Users with `manage_options` | Creating, editing and deleting everything |
| **Tracking** | Anyone, rate-limited | View and click tracking |

For authenticated requests from the browser, send the `X-WP-Nonce` header with a `wp_rest` nonce. From another server, use [Application Passwords](https://make.wordpress.org/core/2020/11/05/application-passwords-integration-guide/).

## Public routes

### Get a widget's render data

```http
GET /wp-json/productreels/v1/render/{widget_id}
```

Returns everything needed to draw a widget: its styles and its reels, with titles, video and cover links, view counts and product links. It never returns visitor or order data.

**Example:**

```bash
curl https://lumaskin.com/wp-json/productreels/v1/render/3
```

### Get a single reel's render data

```http
GET /wp-json/productreels/v1/render/reel/{reel_id}
```

### Get product data for several products

```http
GET /wp-json/productreels/v1/products/batch
```

Used by the player to fetch product cards.

{% hint style="info" %}
If **Allow public fetch** is turned off in [Settings](../configuration/settings.md#public-api), requests from other sites to public routes get an authorization error. Your own pages keep working.
{% endhint %}

## Tracking routes

| Method | Route | Description |
| --- | --- | --- |
| `POST` | `/widgets/{widget_id}/reels/{reel_id}/view` | Record a view. Rate-limited per visitor using your [View tracking](../configuration/settings.md#view-tracking) settings. |
| `POST` | `/track/click` | Record a product or button click |

## Admin routes

All need `manage_options` unless noted.

### Widgets

| Method | Route | Description |
| --- | --- | --- |
| `GET` | `/widgets` | List widgets (also open to `edit_posts`) |
| `POST` | `/widgets` | Create a widget |
| `GET` | `/widgets/{id}` | Get one widget (also open to `edit_posts`) |
| `PUT` / `PATCH` | `/widgets/{id}` | Update a widget |
| `DELETE` | `/widgets/{id}` | Delete a widget |
| `POST` | `/widgets/{id}/duplicate` | Duplicate a widget |
| `GET` | `/widgets/{id}/stats` | Views and clicks per reel and button |

### Reels

| Method | Route | Description |
| --- | --- | --- |
| `GET` | `/reels` | List reels |
| `POST` | `/reels` | Create a reel |
| `GET` | `/reels/{id}` | Get one reel |
| `PUT` / `PATCH` | `/reels/{id}` | Update a reel |
| `DELETE` | `/reels/{id}` | Delete a reel |
| `GET` | `/reels/counts` | Counts for the library filters |
| `POST` | `/reels/bulk-delete` | Delete several reels |
| `POST` | `/reels/validate-url` | Check a video link before adding it |

### Other

| Method | Route | Description |
| --- | --- | --- |
| `GET` | `/products` | Search WooCommerce products by name or SKU |
| `GET` | `/overview` | Totals and top reels for the Widgets screen |
| `POST` | `/overview/guide` | Mark the getting-started guide as done |
| `GET` | `/settings` | Read settings |
| `PUT` / `PATCH` | `/settings` | Update settings |

## Example: list widgets from another server

```bash
curl -u "admin:abcd efgh ijkl mnop qrst uvwx" \
  https://lumaskin.com/wp-json/productreels/v1/widgets
```

## Example: change a setting

```bash
curl -X PATCH \
  -u "admin:abcd efgh ijkl mnop qrst uvwx" \
  -H "Content-Type: application/json" \
  -d '{"view_limit": 1, "view_interval": 1440}' \
  https://lumaskin.com/wp-json/productreels/v1/settings
```

Setting keys: `view_limit`, `view_interval`, `allow_public_fetch`, `cache_render`, `cache_ttl` (seconds), `delete_data_on_uninstall`. Unknown keys are ignored and values outside the allowed range are clamped.

{% hint style="warning" %}
The fields of the admin routes may grow in future versions. Existing fields keep their names and types, but read responses defensively and ignore fields you don't recognise.
{% endhint %}
