import logging
import os
import threading

logger = logging.getLogger(__name__)


def _append_row(feedback):
    try:
        from decouple import config
        import gspread
        from google.oauth2.service_account import Credentials

        creds_path = config('GOOGLE_SHEETS_CREDENTIALS', default='')
        spreadsheet_id = config('GOOGLE_SHEETS_SPREADSHEET_ID', default='')
        if not creds_path or not spreadsheet_id:
            return

        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        creds_abs = os.path.join(base_dir, creds_path)

        scopes = ['https://www.googleapis.com/auth/spreadsheets']
        creds = Credentials.from_service_account_file(creds_abs, scopes=scopes)
        client = gspread.authorize(creds)
        sheet = client.open_by_key(spreadsheet_id).sheet1

        if not sheet.get_all_values():
            sheet.append_row(['Timestamp', 'Satisfaction', 'Reason', 'Page URL', 'User ID', 'User Email'])

        sheet.append_row([
            feedback.created_at.strftime('%Y-%m-%d %H:%M:%S'),
            feedback.satisfaction,
            feedback.get_reason_display(),
            feedback.page_url or '',
            str(feedback.user_id) if feedback.user_id else 'anonymous',
            feedback.user.email if feedback.user else 'anonymous',
        ])
    except Exception as e:
        logger.error(f"Google Sheets sync failed: {e}")


def sync_to_sheet(feedback):
    threading.Thread(target=_append_row, args=(feedback,), daemon=True).start()
