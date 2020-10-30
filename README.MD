<p align="center">
<h1>Light-Arrow</h1>
</p>

<p align="center">
<img alt="npm" src="https://img.shields.io/npm/v/light-arrow?color=g">
<img alt="GitHub Workflow Status" src="https://img.shields.io/github/workflow/status/lauri3new/light-arrow/Node.js%20CI">
</p>

## About

Light Arrow is a small library for type safe asynchronous programming in typescript. The library is based around the functional and composable Arrow data type. Arrows are data structures that describe asynchronous (and synchronous) operations that can succeed or fail and may have some dependencies. Please check out the documentation https://lauri3new.github.io/light-arrow-docs/ for a longer explanation and some examples. Arrows won't actually perform any operation until the run method is called, giving them the desirable property of being referentially transparent. The Arrow data type also provides a nice way to perform dependency injection as we can group all the dependencies of the program into a single object type and provide test and production implementations of these in the run method as we wish.

As well as the Arrow this module exposes helper functions for building type safe http apps using the express framework. Please see this section https://lauri3new.github.io/light-arrow-docs/docs/HttpApp of the documentation for more detail.

Inspiration from the highly recommended book *functional programming in scala* Manning, the scala libraries Cats, ZIO and http4s amongst others.

## Getting Started

Installation

```bash
npm install --save light-arrow
```