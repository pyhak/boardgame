interface GameSetupDialogProps {
  playerName: string;
  onPlayerNameChange: (playerName: string) => void;
  onStartGame: () => void;
}

export function GameSetupDialog({
  playerName,
  onPlayerNameChange,
  onStartGame,
}: GameSetupDialogProps) {
  return (
    <section className="game-dialog" aria-label="Game setup">
      <div className="game-dialog-card">
        <p className="game-dialog-kicker">Alusta mängu</p>
        <label className="game-name-field">
          Mängija nimi
          <input
            autoComplete="nickname"
            autoFocus
            onChange={(event) => onPlayerNameChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                onStartGame();
              }
            }}
            value={playerName}
          />
        </label>
        <button onClick={onStartGame} type="button">
          Alusta mängu
        </button>
      </div>
    </section>
  );
}
