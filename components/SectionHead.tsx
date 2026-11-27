type Props = { kicker: string; title: string; accent?: string; text?: string; light?: boolean };

export default function SectionHead({ kicker, title, accent, text, light = false }: Props) {
  const [before, after] = accent ? title.split(accent) : [title, ''];
  return (
    <div className={`section-head${light ? ' light' : ''}`}>
      <p className={`kicker${light ? ' kicker-light' : ''}`} data-reveal="up"><span />{kicker}</p>
      <h2 data-reveal="up" style={{ '--d': '70ms' }}>{before}{accent && <em>{accent}</em>}{after}</h2>
      {text && <p className="section-text" data-reveal="up" style={{ '--d': '140ms' }}>{text}</p>}
    </div>
  );
}
