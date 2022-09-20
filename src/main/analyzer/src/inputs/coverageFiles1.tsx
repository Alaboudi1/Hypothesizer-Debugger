import React, { useReducer, useEffect } from "react";

import Header from "./Header";
import Movie from "./Movie";
import Search from "./Search";
import { initialState, reducer } from "../store/reducer";
import axios from "axios";
import "./App.css";
const MOVIE_API_URL = "https://www.omdbapi.com/?s=man&apikey=4a3b711b";

export const App = (): JSX.Element => {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    axios.get(MOVIE_API_URL).then((jsonResponse) => {
      dispatch({
        type: "SEARCH_MOVIES_SUCCESS",
        payload: jsonResponse.data.Search,
      });
    });
  }, []);

  const fetchMovies = (searchValue: string): void => {
    dispatch({
      type: "SEARCH_MOVIES_REQUEST",
    });

    axios(`https://www.omdbapi.com/?s=${searchValue}&apikey=4a3b711b`).then(
      (jsonResponse) => {
        if (jsonResponse.data.Response === "True") {
          dispatch({
            type: "SEARCH_MOVIES_SUCCESS",
            payload: jsonResponse.data.Search,
          });
        } else {
          dispatch({
            type: "SEARCH_MOVIES_FAILURE",
            error: jsonResponse.data.Error,
          });
        }
      }
    );
  };

  const { movies, errorMessage, loading } = state;

  const retrievedMovies: JSX.Element[] | JSX.Element =
    loading && !errorMessage ? (
      <div className="spinner">⏳Loading...</div>
    ) : errorMessage ? (
      <div className="errorMessage">⚠️{errorMessage}</div>
    ) : (
      <div className="movies">
        {movies.map((movie, index) => (
          <Movie key={`${index}-${movie.Title}`} movie={movie} />
        ))}
      </div>
    );

  return (
    <div className="container">
      <div className="title">
        <Header text="Search For Your Favourite Movies 🎥 " />

        <Search search={fetchMovies} />

        <p className="App-intro">Sharing a few of our favourite movies</p>
      </div>
      <div>{retrievedMovies}</div>
    </div>
  );
};
