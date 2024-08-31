"use client"
import Image from "next/image";
import Navbar from "./components/navBar";
import { useQuery } from "react-query";
import axios from "@/node_modules/axios/index";
import { format } from "@/node_modules/date-fns/format";
import { parseISO } from "@/node_modules/date-fns/parseISO";
import Container from "./components/container";
import { convertKelvinToCelsius } from "./utils/convertKelvinToCelsius";
import WeatherIcon from "./components/weatherIcon";
import { getDayOrNightIcon } from "./utils/getDayOrNightIcon";
import { metersToKilometers } from "./utils/metersToKilometers";
import WeatherDetails from "./components/weatherDetails";
import { fromUnixTime } from "@/node_modules/date-fns/fromUnixTime";
import { convertWindSpeed } from "./utils/convertWindSpeed";
import { Key } from "react";
import ForecastWeatherDetail from "./components/forecastWeatherDetail";
import { useAtom } from "@/node_modules/jotai/react";
import { loadingCityAtom, placeAtom } from "./atom";
import { useEffect } from "react";

// https://api.openweathermap.org/data/2.5/forecast?q=pune&appid=c0bf9ee521014f26d7dec0c0afd52af4&cnt=56
// https://api.openweathermap.org/data/2.5/forecast?q=$(place)&appid=$(place)&cnt=56

interface WeatherData {
  cod: string;
  message: number;
  cnt: number;
  list: WeatherForecast[];
  city: City;
}

interface WeatherForecast {
  dt: number;
  main: MainWeatherInfo;
  weather: WeatherInfo[];
  clouds: CloudInfo;
  wind: WindInfo;
  visibility: number;
  pop: number;
  sys: SysInfo;
  dt_txt: string;
}

interface MainWeatherInfo {
  temp: number;
  feels_like: number;
  temp_min: number;
  temp_max: number;
  pressure: number;
  sea_level: number;
  grnd_level: number;
  humidity: number;
  temp_kf: number;
}

interface WeatherInfo {
  id: number;
  main: string;
  description: string;
  icon: string;
}

interface CloudInfo {
  all: number;
}

interface WindInfo {
  speed: number;
  deg: number;
  gust: number;
}

interface SysInfo {
  pod: string;
}

interface City {
  id: number;
  name: string;
  coord: Coordinates;
  country: string;
  population: number;
  timezone: number;
  sunrise: number;
  sunset: number;
}

interface Coordinates {
  lat: number;
  lon: number;
}


export default function Home() {
  const [place, setPlace] = useAtom(placeAtom);
  const [loadingCity, setLoadingCity] = useAtom(loadingCityAtom);
  const { isLoading, error, data, refetch } = useQuery<WeatherData>(
    "repoData",
    async () => {
      const { data } = await axios.get(`https://api.openweathermap.org/data/2.5/forecast?q=${place}&appid=${process.env.NEXT_PUBLIC_WEATHER_KEY}&cnt=56`
      );
      return data;
    }
  );
  useEffect(() => {
    refetch();
  }, [place, refetch])
  const firstData = data?.list[0];

  const uniqueDates = [
    ...new Set(
      data?.list.map(
        (entry: { dt: number; }) => new Date(entry.dt * 1000).toISOString().split("T")[0]
      )
    )
  ];

  //Filtering data to get the first entry after 6AM for each unique date

  const firstDataForEachDate = uniqueDates.map((date) => {
    return data?.list.find((entry: { dt: number; }) => {
      const entryDate = new Date(entry.dt * 1000).toISOString().split("T")[0];
      const entryTime = new Date(entry.dt * 1000).getHours();
      return entryDate == date && entryTime >= 6;
    });
  });

  if (isLoading)
    return (
      <div className="flex items-center min-h-screen justify-center">
        <p className="animate-bounce">Loading...</p>
      </div>
    );
  return (
    <div className="flex flex-col gap-4 bg-gray-100 min-h-screen">
      <Navbar location={data?.city.name} />
      <main className="px-3 max-w-7xl mx-auto flex flex-col gap-9 w-full pb-10 pt-4">
        {/* today data */}
        {loadingCity ? (<WeatherSkeleton />) : (
          <>
            <section className="space-y-4">
              <div className="space-y-2">
                <h2 className="flex gap-1 text-2xl items-end">
                  <p className="">{format(parseISO(firstData?.dt_txt ?? ''), "EEEE")}</p>
                  <p className="text-lg">({format(parseISO(firstData?.dt_txt ?? ''), "MM-dd-yyyy")})</p>
                </h2>
                <Container className="gap-10 px-6 items-center">
                  {/* temperature */}
                  <div className="flex flex-col px-4">
                    <span className="text-5x1">
                      {convertKelvinToCelsius(firstData?.main.temp ?? 296.37)}°
                    </span>
                    <p className="text-xs space-x-1 whitespace-nowrap">
                      <span>Feels like</span>

                    </p>
                    <p className="text-xs space-x-2">
                      <span>
                        {convertKelvinToCelsius(firstData?.main.temp_min ?? 0)}°
                      </span>
                      <span>{convertKelvinToCelsius(firstData?.main.temp_max ?? 0)}°</span>
                    </p>
                  </div>
                  {/* time and weather icon */}
                  <div className="flex gap-10 sm:gap-16 overflow-x-auto w-full justify-between pr-3">
                    {data?.list.map((d: { dt_txt: string; weather: { icon: string; }[]; main: { temp: any; }; }, i: Key | null | undefined) =>
                      <div key={i}
                        className="flex flex-col justify-between gap-2 items-center text-xs font-semibold">
                        <p className="whitespace-nowrap">
                          {format(parseISO(d.dt_txt), 'h:mm a')}

                        </p>
                        <WeatherIcon iconName={getDayOrNightIcon(d.weather[0].icon, d.dt_txt)}></WeatherIcon>
                        <p>{convertKelvinToCelsius(d?.main.temp ?? 0)}°</p>
                      </div>

                    )}
                  </div>
                </Container>
              </div>
              <div className="flex gap-4">
                <Container className="w-fit justify-center flex-col px-4 items-center">
                  <p className="capitalize text-center">{firstData?.weather[0].description}</p>
                  <WeatherIcon iconName={getDayOrNightIcon(firstData?.weather[0].icon ?? "", firstData?.dt_txt ?? "")}></WeatherIcon>
                </Container>

                <Container className="bg-yellow-300/80 px-6 gap-4 justify-between overflow-x-auto">
                  <WeatherDetails visability={metersToKilometers(firstData?.visibility ?? 10000)}
                    airPressure={`${firstData?.main.pressure} hPa`}
                    humidity={firstData?.main.humidity}
                    windSpeed={convertWindSpeed(firstData?.wind.speed)}
                    sunrise={format(fromUnixTime(data?.city.sunrise ?? 100000000), "H:mm")}
                    sunset={format(fromUnixTime(data?.city.sunset ?? 100000000), "H:mm")}></WeatherDetails>
                </Container>
              </div>
            </section>


            {/* 7-day forecast data */}
            <section className="flex w-full flex-col gap-4">
              <p className="text-2xl">Forecast (7 Days)</p>
              {firstDataForEachDate.map((d, i) => (
                <ForecastWeatherDetail key={i}
                  description={d?.weather[0].description}
                  weatherIcon={d?.weather[0].icon ?? "01d"}
                  date={format(parseISO(d?.dt_txt ?? ""), "MM.dd")}
                  day={format(parseISO(d?.dt_txt ?? ""), "EEEE")}
                  feels_like={d?.main.feels_like ?? 0}
                  temp={d?.main.temp ?? 0}
                  temp_max={d?.main.temp_max}
                  temp_min={d?.main.temp_min}
                  airPressure={`${d?.main.pressure}`}
                  humidity={`${d?.main.humidity}`}
                  sunrise={format(fromUnixTime(data?.city.sunrise ?? 100000000), "H:mm")}
                  sunset={format(fromUnixTime(data?.city.sunset ?? 100000000), "H:mm")}
                  visability={`${metersToKilometers(d?.visibility ?? 10000)}`}
                  windSpeed={`${convertWindSpeed(d?.wind.speed)}`} />
              ))}

            </section>
          </>)}
      </main>
    </div>
  );
}

const WeatherSkeleton = () => {
  return (
    <main className="px-3 max-w-7xl mx-auto flex flex-col gap-9 w-full pb-10 pt-4 animate-pulse">
      {/* Today data skeleton */}
      <section className="space-y-4">
        <div className="space-y-2">
          <h2 className="flex gap-1 text-2xl items-end">
            <div className="bg-gray-300 rounded h-6 w-20"></div>
            <div className="bg-gray-300 rounded h-4 w-32"></div>
          </h2>
          <div className="flex gap-10 px-6 items-center">
            {/* Temperature skeleton */}
            <div className="flex flex-col px-4">
              <div className="bg-gray-300 rounded h-10 w-16 mb-2"></div>
              <div className="bg-gray-300 rounded h-4 w-24 mb-1"></div>
              <div className="bg-gray-300 rounded h-4 w-20"></div>
            </div>
            {/* Time and weather icon skeleton */}
            <div className="flex gap-10 sm:gap-16 overflow-x-auto w-full justify-between pr-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex flex-col justify-between gap-2 items-center text-xs font-semibold">
                  <div className="bg-gray-300 rounded h-4 w-12"></div>
                  <div className="bg-gray-300 rounded-full h-10 w-10"></div>
                  <div className="bg-gray-300 rounded h-4 w-8"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="flex gap-4">
          <div className="w-fit justify-center flex-col px-4 items-center">
            <div className="bg-gray-300 rounded h-4 w-32 mb-2"></div>
            <div className="bg-gray-300 rounded-full h-16 w-16"></div>
          </div>
          <div className="bg-yellow-300/80 px-6 gap-4 justify-between overflow-x-auto">
            <div className="flex flex-col gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-gray-300 rounded h-4 w-32"></div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 7-day forecast skeleton */}
      <section className="flex w-full flex-col gap-4">
        <div className="bg-gray-300 rounded h-6 w-48 mb-4"></div>
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="flex justify-between items-center">
            <div className="flex flex-col gap-1 w-full">
              <div className="bg-gray-300 rounded h-4 w-32"></div>
              <div className="bg-gray-300 rounded h-4 w-24"></div>
            </div>
            <div className="flex items-center gap-4">
              <div className="bg-gray-300 rounded-full h-10 w-10"></div>
              <div className="bg-gray-300 rounded h-4 w-8"></div>
            </div>
          </div>
        ))}
      </section>
    </main>
  );
};
