import React, { useState, useEffect } from "react";
import mockUser from "./mockData.js/mockUser";
import mockRepos from "./mockData.js/mockRepos";
import mockFollowers from "./mockData.js/mockFollowers";
import axios from "axios";

const rootUrl = "https://api.github.com";

const GithubContext = React.createContext();

const GithubProvider = ({ children }) => {
  const [githubUser, setGithubUser] = useState(mockUser);
  const [repos, setRepos] = useState(mockRepos);
  const [followers, setFollowers] = useState(mockFollowers);

  
  //request loading
  const [requests, setRequests] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  // error
  const [error, setError] = useState({ show: false, msg: "" });

  // gitting user
  const searchGithubUser = async (user) => { 
    console.log(user); // here it is coming from "search component"
    toggleError(); // calling back to make the initial state as it was before (not hord require,   but good)
    //setLoading (true)
    setIsLoading(true);
    const response = await axios(`${rootUrl}/users/${user}`).catch((err) =>
      console.log(err)
    );
    if (response) {
      setGithubUser(response.data);
      // more logic here
      //repos
      //---------------------------------------------------------------------
      //------by this we gtes data ane after other ( like fisrt user the repos, followers)-----------------
      //   axios(`${rootUrl}/users/${user}/repos?per_page=100`)
      //   .then((response)=> setRepos(response.data))
      //   .catch((error)=> console.log(error))
      //   //followers
      //   axios(`${rootUrl}/users/${user}/followers`)
      //   .then((response)=> setFollowers(response.data))
      //   .catch((error)=> console.log(error))
      //-------------------------------------------------------------------------------------------
      //---------by this the page will be vsible after are the data has been came.-----------------
      await Promise.allSettled([
        await axios(`${rootUrl}/users/${user}/repos?per_page=100`),
        await axios(`${rootUrl}/users/${user}/followers`),
      ]).then((result) => {
        console.log(result);
        const [repos, followers] = result;
        const status = "fulfilled";
        if (repos.status === status) {
          setRepos(repos.value.data);
        }
        if (followers.status === status) {
          setFollowers(followers.value.data);
        }
      }).catch((err)=> console.log(err));
      //-------------------------,,--------------------
    } else {
      toggleError(true, "There is no user with this username");
    }
    checkRequests();
    setIsLoading(false);
  };

  // check rate
  const checkRequests = () => {
    axios(`${rootUrl}/rate_limit`)
      .then(({ data }) => {
        // by curly vraces we have destrustured it here, check without curly braces.
        let {
          rate: { remaining },
        } = data; // destructured "remaining" 
        setRequests(remaining);
        if (remaining === 0) {
          toggleError(
            true,
            "Sorry, You have exceeded your hourly reate limit !"
          );
        }
      })
      .catch((error) => {
        console.error("axios error in getting rate data", error);
      });
  };
  function toggleError(show = false, msg = "") {
    setError({ show, msg });
  }
  //   error
  //   we can use check request function call in use effect, will work always, but many waringgs comes.
  //   it means it is depended on inner callback function, instead use it as a call back
  //     useEffect(() => {
  //     checkRequests();
  //   }, []);
  //   like this
  useEffect(checkRequests, []);
  return (
    <GithubContext.Provider
      value={{
        githubUser,
        repos,
        followers,
        requests,
        error,
        searchGithubUser,
        isLoading,
      }}
    >
      {children}
    </GithubContext.Provider>
  );
};

export { GithubProvider, GithubContext };
