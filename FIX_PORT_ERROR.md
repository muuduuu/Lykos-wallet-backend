# Fix Port 3000 Already in Use Error

## Problem
Port 3000 is already in use by another process.

## Solution

### Option 1: Kill Process Using Port 3000 (Windows)
```powershell
# Find process ID
netstat -ano | findstr :3000

# Kill the process (replace PID with actual process ID)
taskkill /F /PID <PID>

# Or kill all node processes (be careful!)
taskkill /F /IM node.exe
```

### Option 2: Change Port (Easier)
Edit `.env` file and change the API Gateway port:

```
API_GATEWAY_PORT=3001
```

Then update other services to match, or just use a different port temporarily.

### Option 3: Restart Everything
```powershell
# Stop all node processes
taskkill /F /IM node.exe

# Then run again
npm run dev:full
```

## Quick Fix Command
```powershell
# This kills any process using port 3000
Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess | Stop-Process -Force
```
