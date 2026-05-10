import json
import logging
import os
import threading

logger = logging.getLogger(__name__)


def _append_row(feedback):
    try:
        from decouple import config
        import gspread
        from google.oauth2.service_account import Credentials

        spreadsheet_id = config('GOOGLE_SHEETS_SPREADSHEET_ID', default='')
        if not spreadsheet_id:
            return

        scopes = ['https://www.googleapis.com/auth/spreadsheets']

        creds_json = config('GOOGLE_SHEETS_CREDENTIALS_JSON', default='')
        if creds_json:
            info = json.loads(creds_json)
            creds = Credentials.from_service_account_info(info, scopes=scopes)
        else:
            creds_path = config('GOOGLE_SHEETS_CREDENTIALS', default='')
            if not creds_path:
                return
            base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            creds_abs = os.path.join(base_dir, creds_path)
            creds = Credentials.from_service_account_file(creds_abs, scopes=scopes)

        from zoneinfo import ZoneInfo
        client = gspread.authorize(creds)
        sheet = client.open_by_key(spreadsheet_id).sheet1

        rows = sheet.get_all_values()
        if not rows or not rows[0] or rows[0][0] != 'Timestamp':
            sheet.insert_row(['Timestamp', 'Satisfaction', 'Reason', 'Page URL', 'User ID', 'User Email'], index=1)

        local_time = feedback.created_at.astimezone(ZoneInfo('Australia/Sydney'))
        sheet.append_row([
            local_time.strftime('%Y-%m-%d %H:%M:%S'),
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
