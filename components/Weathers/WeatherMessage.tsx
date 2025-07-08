"use server";

import { getTodayWeather } from "@/actions/weather";

type WeatherMessageProps = {
  temperature?: number | null;
  isRaining?: boolean;
  isCloudy?: boolean;
};

const randomPick = (options: string[]) =>
  options[Math.floor(Math.random() * options.length)];

export default async function WeatherMessage({
  temperature: propTemperature,
  isRaining: propIsRaining,
  isCloudy: propIsCloudy,
}: WeatherMessageProps) {
  // Récupérer la météo depuis la base de données si pas fournie en props
  let weatherData = null;
  if (!propTemperature && !propIsRaining && !propIsCloudy) {
    weatherData = await getTodayWeather();
  }
  
  const temperature = propTemperature ?? weatherData?.temperature ?? null;
  const isRaining = propIsRaining ?? weatherData?.isRaining ?? false;
  const isCloudy = propIsCloudy ?? weatherData?.isCloudy ?? false;
  
  if (temperature === null) return null;

  const getMessage = () => {
    if (isRaining) {
      if (temperature < 10) {
        return randomPick([
          "🌧️ Froid et pluie à Montpellier aujourd'hui. Un bon manteau, ou les transports en commun ?",
          "🌧️ Il fait frisquet et il pleut. Le tramway sera votre meilleur ami aujourd'hui !",
          "🌧️ Pluie et fraîcheur au programme. Les pistes cyclables attendront demain !"
        ]);
      }
      if (temperature < 15) {
        return randomPick([
          "🌧️ C'est humide et un peu frais aujourd'hui. Un imperméable sera votre meilleur allié.",
          "🌧️ Quelques gouttes et une petite fraîcheur. Pensez à votre K-way pour vos déplacements !",
          "🌧️ Pluie légère et fraîcheur à Montpellier. Les transports en commun sont prêts à vous accueillir !"
        ]);
      }
      return randomPick([
        "🌦️ Quelques averses sont prévues. Pour vos trajets à vélo ou trottinette, pensez à vous couvrir !",
        "🌦️ Pluie intermittente aujourd'hui. Les pistes cyclables seront un peu glissantes !",
        "🌦️ Quelques ondées au programme. Privilégiez les trajets courts ou le tramway !"
      ]);
    }

    if (isCloudy) {
      if (temperature < 10) {
        return randomPick([
          "☁️ Le ciel est bas et il fait frais ce matin. N'oubliez pas une couche chaude pour vos trajets doux.",
          "☁️ Temps gris et frais à Montpellier. Une petite laine s'impose pour vos déplacements !",
          "☁️ Ciel couvert et fraîcheur. Les pistes cyclables vous attendent, bien couverts !"
        ]);
      }
      if (temperature < 15) {
        return randomPick([
          "🌫️ Temps gris mais doux. Idéal pour un petit trajet en trottinette ou à vélo.",
          "🌫️ Ciel couvert mais température agréable. Parfait pour tester les nouvelles pistes cyclables !",
          "🌫️ Quelques nuages et une douceur printanière. La mobilité douce est à l'honneur !"
        ]);
      }
      if (temperature < 25) {
        return randomPick([
          "⛅ Le ciel est couvert mais la température est parfaite pour circuler à vélo en ville.",
          "⛅ Temps gris mais doux à Montpellier. Les vélos et trottinettes sont de sortie !",
          "⛅ Quelques nuages mais une belle douceur. Les pistes cyclables vous attendent !"
        ]);
      }
      return randomPick([
        "🌥️ Malgré quelques nuages, il fait chaud aujourd'hui. Hydratez-vous bien pendant vos trajets.",
        "🌥️ Ciel voilé et chaleur à Montpellier. Pensez à votre gourde pour vos déplacements !",
        "🌥️ Nuages et chaleur. Les pistes cyclables sont prêtes, n'oubliez pas de vous hydrater !"
      ]);
    }

    if (temperature < 10) {
      return randomPick([
        "🌤️ Grand ciel bleu mais températures basses. Couvrons-nous bien pour rester actifs dehors !",
        "🌤️ Beau temps mais frais à Montpellier. Une petite laine s'impose pour vos trajets !",
        "🌤️ Ciel dégagé et fraîcheur. Les pistes cyclables vous attendent, bien couverts !"
      ]);
    }
    if (temperature < 20) {
      return randomPick([
        "☀️ Temps idéal à Montpellier pour enfourcher un vélo ou prendre la trottinette.",
        "☀️ Beau temps et douceur. Les pistes cyclables sont parfaites pour vos déplacements !",
        "☀️ Ciel bleu et température parfaite. La mobilité douce est à l'honneur aujourd'hui !"
      ]);
    }
    if (temperature < 25) {
      return randomPick([
        "☀️ Il fait chaud ! Évitez les heures de pointe pour vos trajets à pied ou en deux roues.",
        "☀️ Belle chaleur à Montpellier. Pensez à votre gourde pour vos déplacements !",
        "☀️ Temps chaud et ensoleillé. Les pistes cyclables vous attendent, n'oubliez pas de vous hydrater !"
      ]);
    }
    if (temperature < 30) {
      return randomPick([
        "🔥 Chaleur intense aujourd'hui. Si possible, restez à l'ombre et déplacez-vous tôt ou tard.",
        "🔥 Il fait très chaud à Montpellier. Privilégiez les trajets à l'ombre",
        "🔥 Forte chaleur. Pensez à vous hydrater et à faire des pauses !"
      ]);
    }
    if (temperature < 35) {
      return randomPick([
        "🔥 Il fait chaud ! Évitez les heures de pointe pour vos trajets à pied ou en deux roues.",
        "🔥 Il fait très chaud à Montpellier. Privilégiez les trajets à l'ombre ou en tramway !",
        "🔥 Forte chaleur. Pensez à vous hydrater et à faire des pauses !"
      ]);
    }

    return randomPick([
      "🔥 Canicule aujourd'hui. Les transports en commun seront plus confortables !",
      "🔥 Chaleur extrême à Montpellier. Pensez à prendre le tramway qui est climatisé !",
      "🔥 Température très élevée. Les pistes cyclables attendront demain matin !"
    ]);
  };

  const message = getMessage();

  return (
    <div className="inline-block bg-blue-100/80 backdrop-blur-sm border border-blue-200 rounded-lg px-4 py-2 hover:bg-blue-100 transition-colors duration-200">
      <p className="text-blue-800 font-medium">{message}</p>
    </div>
  );
}
