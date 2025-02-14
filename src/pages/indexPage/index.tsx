import { useNavigate } from "react-router-dom"

export default function IndexPage() {
  const navigate = useNavigate();
  return (
    <div>
      <button onClick={() => navigate('/ts')}>ts</button>
      <button onClick={() => navigate('/stsl')}>stsl</button>
      <button onClick={() => navigate('/slts')}>slts</button>
    </div>
  )
}