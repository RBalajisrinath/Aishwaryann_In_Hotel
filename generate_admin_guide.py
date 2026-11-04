#!/usr/bin/env python3
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak, Table, TableStyle, Image
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY
from datetime import datetime

# Create PDF
pdf_path = "c:\\Users\\Lenovo\\Pictures\\hotel\\ADMIN_PANEL_USER_GUIDE.pdf"
doc = SimpleDocTemplate(pdf_path, pagesize=letter, topMargin=0.5*inch, bottomMargin=0.5*inch)

# Container for the 'Flowable' objects
elements = []

# Define styles
styles = getSampleStyleSheet()
title_style = ParagraphStyle(
    'CustomTitle',
    parent=styles['Heading1'],
    fontSize=24,
    textColor=colors.HexColor('#1e40af'),
    spaceAfter=12,
    alignment=TA_CENTER,
    fontName='Helvetica-Bold'
)

heading_style = ParagraphStyle(
    'CustomHeading',
    parent=styles['Heading2'],
    fontSize=14,
    textColor=colors.HexColor('#1e40af'),
    spaceAfter=8,
    spaceBefore=8,
    fontName='Helvetica-Bold'
)

subheading_style = ParagraphStyle(
    'CustomSubHeading',
    parent=styles['Heading3'],
    fontSize=12,
    textColor=colors.HexColor('#2d5a96'),
    spaceAfter=6,
    spaceBefore=6,
    fontName='Helvetica-Bold'
)

body_style = ParagraphStyle(
    'CustomBody',
    parent=styles['BodyText'],
    fontSize=10,
    alignment=TA_JUSTIFY,
    spaceAfter=6
)

# Title
elements.append(Paragraph("AISHWARYAM INN", title_style))
elements.append(Paragraph("Admin Panel User Guide", heading_style))
elements.append(Paragraph(f"Last Updated: {datetime.now().strftime('%B %d, %Y')}", body_style))
elements.append(Spacer(1, 0.3*inch))

# Table of Contents
elements.append(Paragraph("TABLE OF CONTENTS", heading_style))
toc_data = [
    ["1.", "Getting Started & Login"],
    ["2.", "Dashboard Overview"],
    ["3.", "Room Management"],
    ["4.", "Booking Management"],
    ["5.", "User Management"],
    ["6.", "Amenities Management"],
    ["7.", "Gallery Management"],
    ["8.", "Website Content Manager"],
    ["9.", "Ratings & Reviews"],
    ["10.", "Payment Settings"],
    ["11.", "Hotel Policies"],
    ["12.", "Profile Management"],
    ["13.", "Website Status"],
]
toc_table = Table(toc_data, colWidths=[0.5*inch, 5*inch])
toc_table.setStyle(TableStyle([
    ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
    ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
    ('FONTSIZE', (0, 0), (-1, -1), 10),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
]))
elements.append(toc_table)
elements.append(Spacer(1, 0.3*inch))

# ============= PAGE 1 CONTENT =============
elements.append(PageBreak())

# Section 1: Getting Started
elements.append(Paragraph("1. GETTING STARTED & LOGIN", heading_style))
elements.append(Paragraph("<b>Admin URL:</b> aishwaryaminn.cloud/admin", body_style))
elements.append(Spacer(1, 0.1*inch))
elements.append(Paragraph("<b>Login Steps:</b>", subheading_style))
elements.append(Paragraph("1. Navigate to the admin login page", body_style))
elements.append(Paragraph("2. Enter your email address", body_style))
elements.append(Paragraph("3. Enter your password", body_style))
elements.append(Paragraph("4. Click the 'Login' button", body_style))
elements.append(Spacer(1, 0.1*inch))

elements.append(Paragraph("<b>Session Timeout:</b>", subheading_style))
elements.append(Paragraph("• Your session will automatically expire after 2 minutes of inactivity", body_style))
elements.append(Paragraph("• A warning popup will appear 30 seconds before logout", body_style))
elements.append(Paragraph("• Click 'Stay Logged In' to extend your session", body_style))
elements.append(Spacer(1, 0.2*inch))

# Section 2: Dashboard
elements.append(Paragraph("2. DASHBOARD OVERVIEW", heading_style))
elements.append(Paragraph("The dashboard displays real-time statistics and key metrics:", body_style))
elements.append(Spacer(1, 0.1*inch))

dashboard_data = [
    ["Metric", "Description"],
    ["Total Bookings", "Total number of all bookings in the system"],
    ["Total Revenue", "Sum of all completed payments"],
    ["Occupancy Rate", "Percentage of occupied rooms vs total rooms"],
    ["Active Bookings", "Bookings with 'confirmed' or 'checked_in' status"],
    ["Available Rooms", "Total room units not yet booked"],
    ["Total Users", "Number of guest accounts"],
]
dashboard_table = Table(dashboard_data, colWidths=[2*inch, 3.5*inch])
dashboard_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1e40af')),
    ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
    ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
    ('FONTSIZE', (0, 0), (-1, 0), 10),
    ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
    ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
    ('GRID', (0, 0), (-1, -1), 1, colors.black),
    ('FONTSIZE', (0, 1), (-1, -1), 9),
    ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f3f4f6')]),
]))
elements.append(dashboard_table)
elements.append(Spacer(1, 0.2*inch))

# ============= PAGE 2 CONTENT =============
elements.append(PageBreak())

# Section 3: Room Management
elements.append(Paragraph("3. ROOM MANAGEMENT", heading_style))
elements.append(Paragraph("<b>Add New Room:</b>", subheading_style))
elements.append(Paragraph("1. Click 'Rooms' in the sidebar → 'Add Room'", body_style))
elements.append(Paragraph("2. Fill in room details:", body_style))
elements.append(Paragraph("   • Room Type (e.g., Double Room, Suite)", body_style))
elements.append(Paragraph("   • Room Capacity (number of guests)", body_style))
elements.append(Paragraph("   • Price Per Night", body_style))
elements.append(Paragraph("   • Total Availability (number of rooms)", body_style))
elements.append(Paragraph("   • Description and Amenities", body_style))
elements.append(Paragraph("3. Upload room images", body_style))
elements.append(Paragraph("4. Click 'Save Room'", body_style))
elements.append(Spacer(1, 0.1*inch))

elements.append(Paragraph("<b>Update Room:</b>", subheading_style))
elements.append(Paragraph("1. Click 'Rooms' → Select room from list", body_style))
elements.append(Paragraph("2. Click 'Edit' button", body_style))
elements.append(Paragraph("3. Modify details as needed", body_style))
elements.append(Paragraph("4. Click 'Update Room'", body_style))
elements.append(Spacer(1, 0.1*inch))

elements.append(Paragraph("<b>Delete Room:</b>", subheading_style))
elements.append(Paragraph("1. Click 'Rooms' → Select room from list", body_style))
elements.append(Paragraph("2. Click 'Delete' button (confirm when prompted)", body_style))
elements.append(Spacer(1, 0.2*inch))

# Section 4: Booking Management
elements.append(Paragraph("4. BOOKING MANAGEMENT", heading_style))
elements.append(Paragraph("<b>View Bookings:</b>", subheading_style))
elements.append(Paragraph("1. Click 'Bookings' in the sidebar", body_style))
elements.append(Paragraph("2. View all bookings with their status", body_style))
elements.append(Paragraph("3. Search by Booking ID using the search bar", body_style))
elements.append(Spacer(1, 0.1*inch))

elements.append(Paragraph("<b>Booking Statuses:</b>", subheading_style))
status_data = [
    ["Status", "Meaning"],
    ["pending", "Waiting for payment/approval"],
    ["confirmed", "Payment received and approved"],
    ["checked_in", "Guest has checked in"],
    ["checked_out", "Guest has checked out"],
    ["cancelled", "Booking cancelled by user"],
]
status_table = Table(status_data, colWidths=[2*inch, 3.5*inch])
status_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#10b981')),
    ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
    ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
    ('FONTSIZE', (0, 0), (-1, 0), 9),
    ('BOTTOMPADDING', (0, 0), (-1, 0), 6),
    ('GRID', (0, 0), (-1, -1), 1, colors.black),
    ('FONTSIZE', (0, 1), (-1, -1), 9),
    ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f3f4f6')]),
]))
elements.append(status_table)
elements.append(Spacer(1, 0.1*inch))

elements.append(Paragraph("<b>Approve/Reject Bookings:</b>", subheading_style))
elements.append(Paragraph("1. Go to 'Pending Approvals' section", body_style))
elements.append(Paragraph("2. Review payment proof and guest details", body_style))
elements.append(Paragraph("3. Click 'Approve' or 'Reject'", body_style))
elements.append(Paragraph("4. Guest will receive email notification", body_style))
elements.append(Spacer(1, 0.1*inch))

elements.append(Paragraph("<b>Check Out Guest:</b>", subheading_style))
elements.append(Paragraph("1. Find the checked-in booking", body_style))
elements.append(Paragraph("2. Click 'Checkout' button", body_style))
elements.append(Paragraph("3. System updates booking status automatically", body_style))

# ============= PAGE 3 CONTENT =============
elements.append(PageBreak())

# Section 5: User Management
elements.append(Paragraph("5. USER MANAGEMENT", heading_style))
elements.append(Paragraph("<b>View Users:</b>", subheading_style))
elements.append(Paragraph("1. Click 'Users' in the sidebar", body_style))
elements.append(Paragraph("2. See all registered guest accounts", body_style))
elements.append(Paragraph("3. View user details like email, phone, last login", body_style))
elements.append(Spacer(1, 0.1*inch))

elements.append(Paragraph("<b>User Information Includes:</b>", subheading_style))
elements.append(Paragraph("• First Name & Last Name", body_style))
elements.append(Paragraph("• Email Address", body_style))
elements.append(Paragraph("• Phone Number", body_style))
elements.append(Paragraph("• Account Status (active/inactive)", body_style))
elements.append(Paragraph("• Last Login Date & Time", body_style))
elements.append(Paragraph("• Account Creation Date", body_style))
elements.append(Spacer(1, 0.2*inch))

# Section 6: Amenities
elements.append(Paragraph("6. AMENITIES MANAGEMENT", heading_style))
elements.append(Paragraph("<b>Add Amenity:</b>", subheading_style))
elements.append(Paragraph("1. Click 'Amenities' in the sidebar → 'Add Amenity'", body_style))
elements.append(Paragraph("2. Enter amenity name (e.g., Free WiFi, Pool, Gym)", body_style))
elements.append(Paragraph("3. Select category", body_style))
elements.append(Paragraph("4. Add icon/image if needed", body_style))
elements.append(Paragraph("5. Click 'Save Amenity'", body_style))
elements.append(Spacer(1, 0.1*inch))

elements.append(Paragraph("<b>Update/Delete Amenity:</b>", subheading_style))
elements.append(Paragraph("1. Find amenity in the list", body_style))
elements.append(Paragraph("2. Click 'Edit' to update or 'Delete' to remove", body_style))
elements.append(Paragraph("3. Confirm changes", body_style))
elements.append(Spacer(1, 0.2*inch))

# Section 7: Gallery Management
elements.append(Paragraph("7. GALLERY MANAGEMENT", heading_style))
elements.append(Paragraph("<b>Upload Images:</b>", subheading_style))
elements.append(Paragraph("1. Click 'Gallery' in the sidebar → 'Upload'", body_style))
elements.append(Paragraph("2. Select multiple images from your computer", body_style))
elements.append(Paragraph("3. Add title and description for each image", body_style))
elements.append(Paragraph("4. Click 'Upload' to add to gallery", body_style))
elements.append(Spacer(1, 0.1*inch))

elements.append(Paragraph("<b>Manage Gallery:</b>", subheading_style))
elements.append(Paragraph("1. View all uploaded images", body_style))
elements.append(Paragraph("2. Reorder images by drag & drop", body_style))
elements.append(Paragraph("3. Delete images no longer needed", body_style))

# ============= PAGE 4 CONTENT =============
elements.append(PageBreak())

# Section 8: Website Content
elements.append(Paragraph("8. WEBSITE CONTENT MANAGER", heading_style))
elements.append(Paragraph("<b>Manage Hero Videos:</b>", subheading_style))
elements.append(Paragraph("1. Click 'Website Content' in the sidebar", body_style))
elements.append(Paragraph("2. Go to 'Hero Videos' section", body_style))
elements.append(Paragraph("3. Upload new video or delete existing ones", body_style))
elements.append(Paragraph("4. Reorder videos by drag & drop", body_style))
elements.append(Spacer(1, 0.1*inch))

elements.append(Paragraph("<b>Video Requirements:</b>", subheading_style))
elements.append(Paragraph("• Format: MP4, WebM, or similar web-compatible formats", body_style))
elements.append(Paragraph("• Maximum file size: 500MB", body_style))
elements.append(Paragraph("• Recommended resolution: 1920x1080 or higher", body_style))
elements.append(Paragraph("• Videos display on homepage hero section", body_style))
elements.append(Spacer(1, 0.2*inch))

# Section 9: Ratings & Reviews
elements.append(Paragraph("9. RATINGS & REVIEWS", heading_style))
elements.append(Paragraph("<b>View Reviews:</b>", subheading_style))
elements.append(Paragraph("1. Click 'Ratings & Reviews' in the sidebar", body_style))
elements.append(Paragraph("2. See all guest reviews and ratings", body_style))
elements.append(Paragraph("3. Filter by rating (5 stars, 4 stars, etc.)", body_style))
elements.append(Spacer(1, 0.1*inch))

elements.append(Paragraph("<b>Review Actions:</b>", subheading_style))
elements.append(Paragraph("• View full review text and guest details", body_style))
elements.append(Paragraph("• Delete inappropriate reviews", body_style))
elements.append(Paragraph("• See review date and guest name", body_style))
elements.append(Spacer(1, 0.2*inch))

# Section 10: Payment Settings
elements.append(Paragraph("10. PAYMENT SETTINGS", heading_style))
elements.append(Paragraph("<b>Configure Payment Options:</b>", subheading_style))
elements.append(Paragraph("1. Click 'Payment Settings' in the sidebar", body_style))
elements.append(Paragraph("2. Enable/disable payment methods", body_style))
elements.append(Paragraph("3. Set payment requirements and rules", body_style))
elements.append(Paragraph("4. Configure UPI/Bank details for transfers", body_style))
elements.append(Paragraph("5. Set commission or fee percentages", body_style))
elements.append(Spacer(1, 0.1*inch))

elements.append(Paragraph("<b>Payment Methods Supported:</b>", subheading_style))
elements.append(Paragraph("• Manual Payment (Bank Transfer/UPI)", body_style))
elements.append(Paragraph("• Payment proofs verified by admin", body_style))
elements.append(Paragraph("• Contact information for payment instructions", body_style))

# ============= PAGE 5 CONTENT =============
elements.append(PageBreak())

# Section 11: Hotel Policies
elements.append(Paragraph("11. HOTEL POLICIES", heading_style))
elements.append(Paragraph("<b>Update Policies:</b>", subheading_style))
elements.append(Paragraph("1. Click 'Policies' in the sidebar", body_style))
elements.append(Paragraph("2. Select policy type to edit:", body_style))
elements.append(Paragraph("   • Cancellation Policy", body_style))
elements.append(Paragraph("   • ID Requirement", body_style))
elements.append(Paragraph("   • Check-in/Check-out Times", body_style))
elements.append(Paragraph("   • House Rules", body_style))
elements.append(Paragraph("3. Edit policy text", body_style))
elements.append(Paragraph("4. Click 'Save Policy'", body_style))
elements.append(Spacer(1, 0.1*inch))

elements.append(Paragraph("<b>Policy Display:</b>", subheading_style))
elements.append(Paragraph("• Policies are shown to guests during booking", body_style))
elements.append(Paragraph("• Guests must acknowledge policies before confirming", body_style))
elements.append(Paragraph("• Updated policies apply to new bookings immediately", body_style))
elements.append(Spacer(1, 0.2*inch))

# Section 12: Profile Management
elements.append(Paragraph("12. PROFILE MANAGEMENT", heading_style))
elements.append(Paragraph("<b>Update Admin Profile:</b>", subheading_style))
elements.append(Paragraph("1. Click profile icon in top-right corner", body_style))
elements.append(Paragraph("2. Select 'Profile' from dropdown menu", body_style))
elements.append(Paragraph("3. Update your information:", body_style))
elements.append(Paragraph("   • Full Name", body_style))
elements.append(Paragraph("   • Email Address", body_style))
elements.append(Paragraph("   • Password", body_style))
elements.append(Paragraph("4. Click 'Save Changes'", body_style))
elements.append(Spacer(1, 0.1*inch))

elements.append(Paragraph("<b>Change Password:</b>", subheading_style))
elements.append(Paragraph("1. Go to Profile section", body_style))
elements.append(Paragraph("2. Click 'Change Password'", body_style))
elements.append(Paragraph("3. Enter current password", body_style))
elements.append(Paragraph("4. Enter new password twice for confirmation", body_style))
elements.append(Paragraph("5. Click 'Update Password'", body_style))
elements.append(Spacer(1, 0.2*inch))

# Section 13: Website Status
elements.append(Paragraph("13. WEBSITE STATUS", heading_style))
elements.append(Paragraph("<b>Manage Website Availability:</b>", subheading_style))
elements.append(Paragraph("1. Click 'Website Status' in the sidebar", body_style))
elements.append(Paragraph("2. Toggle website to open/close", body_style))
elements.append(Paragraph("3. When closed, add maintenance message", body_style))
elements.append(Paragraph("4. Guests will see maintenance page instead", body_style))
elements.append(Spacer(1, 0.1*inch))

elements.append(Paragraph("<b>When to Close Website:</b>", subheading_style))
elements.append(Paragraph("• Server maintenance", body_style))
elements.append(Paragraph("• Database updates", body_style))
elements.append(Paragraph("• Emergency maintenance", body_style))
elements.append(Paragraph("• Temporary booking halt", body_style))

# ============= PAGE 6 CONTENT =============
elements.append(PageBreak())

# Tips & Tricks
elements.append(Paragraph("TIPS & BEST PRACTICES", heading_style))
elements.append(Spacer(1, 0.1*inch))

elements.append(Paragraph("<b>1. Data Backup:</b>", subheading_style))
elements.append(Paragraph("• Regularly backup booking data", body_style))
elements.append(Paragraph("• Keep records of important transactions", body_style))
elements.append(Spacer(1, 0.1*inch))

elements.append(Paragraph("<b>2. Security:</b>", subheading_style))
elements.append(Paragraph("• Never share your admin login credentials", body_style))
elements.append(Paragraph("• Change password regularly (every 3 months)", body_style))
elements.append(Paragraph("• Session auto-logs out after 2 minutes of inactivity", body_style))
elements.append(Paragraph("• Always logout when leaving your desk", body_style))
elements.append(Spacer(1, 0.1*inch))

elements.append(Paragraph("<b>3. Customer Service:</b>", subheading_style))
elements.append(Paragraph("• Respond to booking inquiries within 24 hours", body_style))
elements.append(Paragraph("• Process payment approvals quickly (same day if possible)", body_style))
elements.append(Paragraph("• Maintain professional communication", body_style))
elements.append(Spacer(1, 0.1*inch))

elements.append(Paragraph("<b>4. Room Management:</b>", subheading_style))
elements.append(Paragraph("• Update room prices seasonally", body_style))
elements.append(Paragraph("• Keep room descriptions accurate and detailed", body_style))
elements.append(Paragraph("• Add high-quality images for each room type", body_style))
elements.append(Paragraph("• Review and update amenities list regularly", body_style))
elements.append(Spacer(1, 0.1*inch))

elements.append(Paragraph("<b>5. Bookings:</b>", subheading_style))
elements.append(Paragraph("• Verify payment proofs before approval", body_style))
elements.append(Paragraph("• Confirm guest ID proofs match booking details", body_style))
elements.append(Paragraph("• Mark checkouts promptly to update availability", body_style))

# Contact Info
elements.append(Spacer(1, 0.3*inch))
elements.append(PageBreak())
elements.append(Paragraph("SUPPORT & CONTACT", heading_style))
elements.append(Spacer(1, 0.1*inch))

support_data = [
    ["Item", "Details"],
    ["Email", "aishwaryaminn@gmail.com"],
    ["Phone", "+91 9443224498"],
    ["Website", "aishwaryaminn.cloud"],
    ["Admin URL", "aishwaryaminn.cloud/admin"],
    ["Address", "Suguna Vilas, No:1, Nagloor-Yercaud Rd"],
    ["", "Kombaikkadu, Tamil Nadu 636602"],
]
support_table = Table(support_data, colWidths=[1.5*inch, 4*inch])
support_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1e40af')),
    ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
    ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
    ('FONTSIZE', (0, 0), (-1, 0), 11),
    ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
    ('GRID', (0, 0), (-1, -1), 1, colors.black),
    ('FONTSIZE', (0, 1), (-1, -1), 10),
    ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f3f4f6')]),
]))
elements.append(support_table)
elements.append(Spacer(1, 0.3*inch))

# Footer
elements.append(Paragraph("_" * 80, body_style))
elements.append(Spacer(1, 0.1*inch))
footer_text = f"<i>Aishwaryam Inn Admin Panel User Guide | Generated on {datetime.now().strftime('%B %d, %Y at %I:%M %p')}</i>"
elements.append(Paragraph(footer_text, body_style))
elements.append(Paragraph("<i>For support, contact: aishwaryaminn@gmail.com | Phone: +91 9443224498</i>", body_style))

# Build PDF
doc.build(elements)
print(f"✓ PDF generated successfully!")
print(f"✓ File saved at: {pdf_path}")
