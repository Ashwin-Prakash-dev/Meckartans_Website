from PIL import Image, ImageFilter
import numpy as np

def generate():
    src_path = r"C:\Users\nandakishor\.gemini\antigravity-ide\brain\f059d29c-b2ce-4859-836b-44fd3c384e63\.user_uploaded\media_1791815909294.png"
    im = Image.open(src_path).convert("RGBA")
    arr = np.array(im)

    # Detect black silhouette
    lum = 0.299 * arr[:, :, 0] + 0.587 * arr[:, :, 1] + 0.114 * arr[:, :, 2]
    mask = lum < 128

    # Find bounding box
    y_idx, x_idx = np.where(mask)
    pad = 12
    y0, y1 = max(0, y_idx.min() - pad), min(arr.shape[0], y_idx.max() + pad)
    x0, x1 = max(0, x_idx.min() - pad), min(arr.shape[1], x_idx.max() + pad)

    cropped_mask = mask[y0:y1, x0:x1]
    h, w = cropped_mask.shape

    # Function to create high quality outlined cursor image
    def make_cursor_image(fill_color, border_color, outline_width=6):
        # High res canvas
        canvas = np.zeros((h, w, 4), dtype=np.uint8)
        
        # Binary mask as PIL Image to create outline via dilation
        m_img = Image.fromarray((cropped_mask * 255).astype(np.uint8), mode="L")
        
        # Dilate mask for border
        border_mask = m_img.filter(ImageFilter.MaxFilter(outline_width * 2 + 1))
        b_arr = np.array(border_mask) > 100
        
        # Draw border
        canvas[b_arr, 0] = border_color[0]
        canvas[b_arr, 1] = border_color[1]
        canvas[b_arr, 2] = border_color[2]
        canvas[b_arr, 3] = 255

        # Draw fill on top
        canvas[cropped_mask, 0] = fill_color[0]
        canvas[cropped_mask, 1] = fill_color[1]
        canvas[cropped_mask, 2] = fill_color[2]
        canvas[cropped_mask, 3] = 255

        return Image.fromarray(canvas)

    # Default cursor: Bone-white (#F2F2F0) with dark shadow border & red nose accent
    default_hires = make_cursor_image(fill_color=(242, 242, 240), border_color=(20, 20, 24), outline_width=8)
    # Hover cursor: Team racing red (#E5202E) with white outline
    hover_hires = make_cursor_image(fill_color=(229, 32, 46), border_color=(255, 255, 255), outline_width=8)

    # Save 32x32 cursors (optimal OS cursor size)
    default_32 = default_hires.resize((32, 32), Image.Resampling.LANCZOS)
    default_32.save("public/media/cursor-kart-32.png")
    
    hover_32 = hover_hires.resize((32, 32), Image.Resampling.LANCZOS)
    hover_32.save("public/media/cursor-kart-hover-32.png")

    # Save 48x48 cursors (for high DPI)
    default_48 = default_hires.resize((48, 48), Image.Resampling.LANCZOS)
    default_48.save("public/media/cursor-kart-48.png")
    
    hover_48 = hover_hires.resize((48, 48), Image.Resampling.LANCZOS)
    hover_48.save("public/media/cursor-kart-hover-48.png")

    # Save high-res for SVG / component
    default_hires.resize((128, 128), Image.Resampling.LANCZOS).save("public/media/cursor-kart-128.png")
    hover_hires.resize((128, 128), Image.Resampling.LANCZOS).save("public/media/cursor-kart-hover-128.png")

    print("Successfully generated all cursor assets!")

if __name__ == "__main__":
    generate()
