#!/bin/bash
if [ "$RAILWAY_SERVICE_NAME" = "corn" ]; then
  bash cron.sh
else
  bash start.sh
fi
