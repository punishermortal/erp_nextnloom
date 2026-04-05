# Logo Setup Instructions

## Adding the NextBloom Logo

1. **Save your logo image** as `logo.png` in the `frontend/public/` directory
   - Recommended size: 512x512 pixels (or larger, square format)
   - Format: PNG with transparent background (preferred) or JPG
   - The logo should be circular or square as it will be displayed in a circular frame

2. **File location:**
   ```
   frontend/public/logo.png
   ```

3. **Alternative formats:**
   - If you have the logo in a different format, you can also use:
     - `logo.jpg`
     - `logo.svg` (best for scalability)
   - Just update the image source in the components if using a different format

4. **The logo will appear:**
   - In the navbar (circular, 48x48px)
   - In the footer (circular, 64x64px)
   - On the homepage hero section (circular, 128-160px with border)

## Current Implementation

The logo is already integrated into:
- ✅ Navbar component
- ✅ Footer component  
- ✅ Homepage hero section

All logos are displayed in circular frames with proper styling and fallback text if the image doesn't load.

## Testing

After adding the logo file:
1. Restart your Next.js development server
2. The logo should appear automatically in all locations
3. If the image doesn't load, you'll see "NB" as a fallback

## Logo Specifications

- **Navbar**: 48x48px circular
- **Footer**: 64x64px circular
- **Hero Section**: 128-160px circular with white border
- **Border**: 2-4px border in primary/accent colors
- **Shape**: Circular (rounded-full class)

