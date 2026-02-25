interface ILobbyView {
  state: string;
  status?: string;
  quizId?: string;
  players?: any[];
  pongServer: () => void;
  isAdmin?: boolean;
}

export default function LobbyView({
  state,
  pongServer,
  status,
  quizId,
  players,
  isAdmin = false,
}: ILobbyView) {
  return (
    <div className="relative z-50 p-6 max-w-2xl mx-auto space-y-6 bg-white shadow-lg rounded-xl border mt-10">
      <h1 className="text-2xl font-bold border-b pb-2">Quiz Lobby</h1>

      <div className="flex items-center gap-3">
        <div
          className={`w-3 h-3 rounded-full ${status === 'Connected' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}
        />
        <p className="font-mono font-medium">Status: {status}</p>
      </div>

      <p className="font-mono font-medium">Quiz ID: {quizId}</p>
      <p className="font-mono font-medium">Quiz State: {state}</p>
      {isAdmin && (
        <p className="text-sm text-gray-500">
          You are the admin of this quiz. Use the controls below to manage the
          quiz flow.
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all active:scale-95 shadow-sm"
          onClick={pongServer}
        >
          Ping Server
        </button>
      </div>

      <div className="mt-6">
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
          Debug Log (Players)
        </h2>
        <pre className="bg-slate-900 text-emerald-400 p-4 rounded-lg mt-2 overflow-x-auto text-xs leading-relaxed">
          {players && Object.keys(players).length > 0
            ? JSON.stringify(players, null, 2)
            : '// No players in state'}
        </pre>
      </div>
    </div>
  );
}
