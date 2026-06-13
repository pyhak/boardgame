interface GameStatusProps {
  statusMessage: string;
}

export function GameStatus({ statusMessage }: GameStatusProps) {
  return <p>{statusMessage}</p>;
}
