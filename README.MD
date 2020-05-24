## light-arrow

# Arrow data type
Arrows are data structures that describe asynchronous operations that can succeed or fail that depends on some input state. Please visit the documentation for a longer explanation and some examples. Arrows won't actually perform any operation until the run method is called, this means that Arrows have the nice property of being referentially transparent. By delaying execution until the run method is called, Arrows provide a nice way to perform dependency injection as we can group all the dependencies of the program into a single object type and provide test and production implementations of these in the run method as we wish.

As well as the Arrow data type this module exposes helper functions for building type safe http apps using the express framework. Please see this section of the documentation for more detail.

For functional programmers this is a kind of kleisli datatype with immutable methods, together with some constructor and combinator functions.

Inspiration from the highly recommended book *functional programming in scala* Manning, the scala libraries Cats and http4s amongst others.