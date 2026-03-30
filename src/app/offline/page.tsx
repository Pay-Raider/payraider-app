import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { WifiOff, AlertCircle } from 'lucide-react';

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-200 p-8">
      <Card className="max-w-md w-full shadow-xl border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader className="text-center space-y-4">
          <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto">
            <WifiOff className="h-10 w-10 text-slate-500" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold text-slate-900 flex items-center justify-center gap-2">
              <AlertCircle className="h-6 w-6 text-orange-500" />
              Offline Mode
            </CardTitle>
            <CardDescription className="text-slate-600">
              You&apos;re currently offline. Cached data is available.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-slate-600 space-y-2">
            <p>
              <strong>Available:</strong> Charts, anchor data, and recent metrics (cached)
            </p>
            <p>
              <strong>Not available:</strong> Real-time updates and new data
            </p>
          </div>
          <div className="flex gap-2 pt-2">
            <button
              onClick={() => window.location.reload()}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium transition-colors text-sm"
            >
              Retry Connection
            </button>
            <a
              href="/"
              className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 px-4 rounded-lg font-medium transition-colors text-sm text-center"
            >
              Go Home
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

