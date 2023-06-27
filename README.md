# Hypothesizer Debugger

Hypothesizer is an interactive debugger for web applications that allows developers to recreate bugs they are experiencing and get helpful feedback. Hypothesizer records and analyzes DOM events, API calls, and Network events. It uses this information to provide solutions with code examples from the developer's codebase to fix the bug efficiently.

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for debugging.

### Prerequisites

What things you need to install Hypothesizer and how to install them.

### Docker

You will need docker desktop open while running Hypothesizer.
* Click on this link and download Docker Desktop for your OS
* [Docker](https://www.docker.com/)
* _Windows users: You will be prompted by the docker installation wizard to install WSL 2. Docker Desktop uses the dynamic memory allocation feature in WSL 2 to improve the resource consumption._

### Compatible Web Application
Your project needs to be configured to run side-by-side with Hypothesizer. We have provided an example repository containing Modern Web Application Bugs to try the debugger for yourself.

Head to this [repo](https://github.com/Alaboudi1/modernWebApplicationBugs) and clone the project.

Create a local directory on your machine
```
mkdir modernWebApplicationBugs
```

Clone the [repo](https://github.com/Alaboudi1/modernWebApplicationBugs)
```
cd modernWebApplicationBugs
gh repo clone Alaboudi1/modernWebApplicationBugs
```

Install the dependencies
```
yarn
```
Change Directory to bug-1 and install the dependencies
```
cd bug-1
yarn
```

Run the project
```
yarn start
```

Congrats! You now have a web application running on localhost:3000

Hold that thought while we walk you through the next step.

## Installing Hypothesizer

Similarly you will need to clone [Hypothesizer](https://github.com/Alaboudi1/Hypothesizer-Debugger) 

Create a local directory on your machine
```
mkdir Hypothesizer-Debugger
```

Clone the [repo](https://github.com/Alaboudi1/Hypothesizer-Debugger)
```
cd Hypothesizer-Debugger
gh repo clone Alaboudi1/Hypothesizer-Debugger
```

Install the dependencies and run the Debugger
```
yarn
yarn start
```

This will start up Hypothesizer and open the project running on localhost:3000 in a window side-by-side.

## Using Hypothesizer

Here is an overview of how to use Hypothesizer. The process is the same on MacOS and Windows.

Steps:
1. Open Docker Desktop
2. Start a web application on localhost:3000
3. Start Hypothesizer
4. Click "record"
5. Re-create the bug you are experiencing
6. Click on the most relevant issue
7. Read the given hypothesis and fix the bug in the application

## Authors

* **Abdulaziz Alaboudi** - *Initial work* - [GitHub](https://github.com/Alaboudi1)

### Contributors
* **Hayden Hanson** - [GitHub](https://github.com/HansonSoftware)

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details

## Inspiration

Lacking a correct hypothesis can be an important barrier to making progress in debugging. To address this, we found that offering a debugging aid in the form of potential hypotheses made developers six time more likely to succeed in debugging. 

This suggests important new opportunities for future tools that help developers to get started in finding a debugging hypothesis relevant to their task at hand.

Research Paper - [Using Hypotheses as a Debugging Aid](https://cs.gmu.edu/~tlatoza/papers/UsingHypothesesAsADebuggingAid.pdf)
