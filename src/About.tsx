import React from "react"

const About: React.FC = () => {
  return (
    <div className="mx-auto w-full max-w-3xl p-4 prose dark:prose-invert">
      <h2>About</h2>
      <p>
        This site was built by <a>@daniellytle</a> to better visualize and
        access cycling workouts.
      </p>
      <h3>Contributing</h3>
      <p>
        Open a pull request{" "}
        <a href="https://github.com/daniellytle/cycling-workout-directory">
          here.
        </a>
      </p>
    </div>
  )
}

export default About
