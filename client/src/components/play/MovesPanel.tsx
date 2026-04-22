interface MovesPanelProps {
  moves: string[]
}

function groupMoves(moves: string[]): Array<[string, string | undefined]> {
  const pairs: Array<[string, string | undefined]> = []
  for (let index = 0; index < moves.length; index += 2) {
    pairs.push([moves[index], moves[index + 1]])
  }
  return pairs
}

export function MovesPanel({ moves }: MovesPanelProps) {
  if (moves.length === 0) {
    return <p className="p-4 text-sm text-muted-foreground">No moves yet.</p>
  }

  return (
    <div className="overflow-y-auto p-4">
      <table className="w-full font-mono text-sm">
        <tbody>
          {groupMoves(moves).map(([white, black], index) => (
            <tr key={index} className="hover:bg-muted/40">
              <td className="w-8 select-none pr-2 text-muted-foreground">{index + 1}.</td>
              <td className="w-16 pr-4">{white}</td>
              <td className="w-16">{black ?? ''}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
