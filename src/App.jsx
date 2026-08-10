import HeroScene from './components/HeroScene'
import RainEffect from './components/RainEffect'
import SteamEffect from './components/SteamEffect'
import Title from './components/Title'
import MusicPlayer from './components/MusicPlayer'
import Clock from './components/Clock'
import VisitorCounter from './components/VisitorCounter'

export default function App() {
  return (
    <div className="relative h-full w-full overflow-hidden">
      <HeroScene />
      <SteamEffect />
      <RainEffect />

      <div className="pointer-events-none absolute inset-0 z-10 flex flex-col p-5 sm:p-8 md:p-10">
        <div className="flex items-start justify-between gap-4">
          <Clock />
          <VisitorCounter />
        </div>

        <div className="flex flex-1 items-center justify-center">
          <Title />
        </div>

        <div className="pointer-events-auto flex justify-center pb-6 sm:pb-8">
          <MusicPlayer />
        </div>
      </div>
    </div>
  )
}
