from django.db import models
import qrcode
from io import BytesIO
from django.core.files import File
from django.conf import settings
import os

# --- 1. Import the Pillow library for image manipulation ---
from PIL import Image, ImageDraw, ImageFont

class Table(models.Model):
    table_number = models.PositiveIntegerField(unique=True)
    qr_code = models.ImageField(upload_to='qr_codes/', blank=True)

    def __str__(self):
        return f"Table {self.table_number}"

    def save(self, *args, **kwargs):
        # Only generate a new QR code if the table is first created.
        if not self.pk:
            # --- 2. Define the layout and content ---
            frontend_url = f"http://localhost:5173/?table={self.table_number}"
            cafe_name = "Sweet Foods" # Your cafe's name
            table_text = f"Table {self.table_number}"
            
            # --- 3. Create the QR code itself ---
            qr = qrcode.QRCode(
                version=1,
                error_correction=qrcode.constants.ERROR_CORRECT_L,
                box_size=10,
                border=2,
            )
            qr.add_data(frontend_url)
            qr.make(fit=True)
            # --- THE FIX IS HERE: Convert the image to 'RGB' to remove transparency ---
            qr_image = qr.make_image(fill_color="black", back_color="white").convert('RGB')

            # --- 4. Create a blank canvas for the final image ---
            canvas_width = 400
            canvas_height = 550
            canvas = Image.new('RGB', (canvas_width, canvas_height), 'white')
            draw = ImageDraw.Draw(canvas)

            # --- 5. Load the built-in default font ---
            try:
                # On some systems, a larger default font can be loaded. We try this first.
                title_font = ImageFont.load_default(size=30)
                table_font = ImageFont.load_default(size=24)
            except AttributeError:
                # Fallback for older Pillow versions
                title_font = ImageFont.load_default()
                table_font = ImageFont.load_default()


            # --- 6. Draw the elements onto the canvas ---
            # Draw Cafe Name (centered at the top)
            title_bbox = draw.textbbox((0, 0), cafe_name, font=title_font)
            title_x = (canvas_width - (title_bbox[2] - title_bbox[0])) / 2
            draw.text((title_x, 40), cafe_name, font=title_font, fill='black')

            # Paste the QR code (centered in the middle)
            qr_x = (canvas_width - qr_image.size[0]) / 2
            qr_y = 120
            canvas.paste(qr_image, (int(qr_x), int(qr_y)))

            # Draw Table Number (centered at the bottom)
            table_bbox = draw.textbbox((0, 0), table_text, font=table_font)
            table_x = (canvas_width - (table_bbox[2] - table_bbox[0])) / 2
            draw.text((table_x, 460), table_text, font=table_font, fill='black')

            # --- 7. Save the final image to a buffer ---
            buffer = BytesIO()
            canvas.save(buffer, 'PNG')
            file_name = f'table-{self.table_number}-branded-qr.png'
            
            # Save the buffer content to the qr_code field
            self.qr_code.save(file_name, File(buffer), save=False)

        super().save(*args, **kwargs)
