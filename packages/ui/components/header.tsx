export function Header({ text }: { text: string }): JSX.Element {
  return <h1 className="text-3xl font-bold text-red-200">{text}</h1>;
}
