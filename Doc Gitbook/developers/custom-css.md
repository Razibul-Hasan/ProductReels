---
description: Fine-tune a widget's look with your own CSS.
---

# Styling with custom CSS

Most styling is done in the widget editor's **Layout** and **Look** steps, with no code. Use custom CSS only for details the editor doesn't cover.

## 1. Give the widget a class

In the widget editor, go to **Advanced → CSS class** and enter a name, for example:

```
luma-stories
```

Save the widget. The class is added to the widget's outer element on your store.

## 2. Add your CSS

Add CSS in **Appearance → Customize → Additional CSS**, in **Appearance → Editor → Styles → Additional CSS** on block themes, or in your child theme's stylesheet.

Always start your selectors with your class, so you only change this one widget.

## Useful selectors

| Selector | Element |
| --- | --- |
| `.luma-stories` | The widget's outer element |
| `.luma-stories .prs-widget__title` | The widget title |
| `.luma-stories .prs-tile` | Each reel tile |
| `.luma-stories .prs-tile--circle` | Each tile in the Circle shape |
| `.luma-stories .prs-tile__below` | The title area below a tile |
| `.luma-stories .prs-play` | The play button |
| `.luma-stories .prs-arrow` | Carousel arrows |

## Examples

### Uppercase, spaced-out titles under the reels

```css
.luma-stories .prs-tile__below {
	text-transform: uppercase;
	letter-spacing: 0.08em;
	font-size: 12px;
}
```

### Limit the width and centre the widget

```css
.luma-stories {
	max-width: 960px;
	margin-inline: auto;
}
```

### Hide the widget on small screens

```css
@media (max-width: 600px) {
	.luma-stories {
		display: none;
	}
}
```

{% hint style="info" %}
The storefront uses your theme's font automatically. You don't need CSS to match your typography.
{% endhint %}

{% hint style="warning" %}
Inner class names (`prs-*`) may change in future versions. Prefer the editor settings where they exist, and keep custom CSS short and scoped to your own class.
{% endhint %}
