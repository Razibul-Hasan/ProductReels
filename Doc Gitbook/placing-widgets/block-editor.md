---
description: Add a widget with the ProductReels block in the WordPress block editor.
---

# Block editor (Gutenberg)

ProductReels includes a block, so you can add a widget without copying shortcodes.

## Add the block

1. Edit a page or post.
2. Click the **+** (block inserter) and search for **ProductReels**. You can also type `/reels` in an empty paragraph.
3. Insert the **ProductReels** block.
4. Choose your widget from the list, for example **Homepage stories**.

The block shows the **live widget** right in the editor, so you can see how it fits the page.

5. Click **Update** or **Publish**.

## Block options

| Option | Description |
| --- | --- |
| **Widget** | Which ProductReels widget to show |
| **Align** | **Wide** or **Full** width, if your theme supports them |
| **Margin** | Space around the block, from the block's Styles panel |

To change how the reels look, edit the widget itself under **ProductReels → Widgets**. Every page using that widget updates automatically.

## Example: a homepage section

Luma Skincare builds its homepage in the block editor:

1. **Cover** block: hero image with *"Glow, naturally."*
2. **Heading** block: *"See it on real skin"*
3. **ProductReels** block → **Homepage stories**, aligned **Wide**
4. **Products** grid below

Because the heading comes from a Heading block, the widget's own title stays **Hidden** in the Layout step.

## Full Site Editing (block themes)

With a block theme, you can add the ProductReels block to templates too:

1. Go to **Appearance → Editor → Templates**.
2. Open **Single Product**.
3. Insert the **ProductReels** block below the product details and choose a widget.
4. **Save**.

Every product page now shows that widget.

{% hint style="info" %}
**Who can add the block?** Anyone who can edit posts can place an existing widget. Only administrators can create or change widgets.
{% endhint %}
