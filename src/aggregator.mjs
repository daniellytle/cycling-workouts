import { readFileSync, readdirSync, writeFileSync, existsSync } from "fs"

const readManifest = () => {
  if (!existsSync("workouts/manifest.json")) return {}
  try {
    return JSON.parse(readFileSync("workouts/manifest.json", "utf8"))
  } catch (error) {
    console.error("Error parsing workouts/manifest.json", error)
    return {}
  }
}

class Aggregator {
  static aggregate = () => {
    const filenames = readdirSync("workouts").filter((f) => f.endsWith(".zwo"))
    const manifest = readManifest()

    const data = filenames.map((filename) => {
      const fileContent = readFileSync(`workouts/${filename}`, {
        encoding: "utf8",
      })
      const meta = manifest[filename] || {}
      return {
        xml: fileContent,
        rider: meta.rider || "",
        tags: meta.tags || [],
      }
    })

    writeFileSync("src/dist/workouts.json", JSON.stringify({ data }), {
      flag: "w+",
    })
    console.log(
      `Wrote out new workouts.json file containing ${data.length} workouts`
    )
  }
}

export default { Aggregator }

Aggregator.aggregate()
