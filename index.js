const express = require("express"); //Import the express dependency
const app = express(); //Instantiate an express app, the main work horse of this server
const port = 5000; //Save the port number where your server will be listening

// Import other files here
const fs = require("fs");
const path = require("path");
const imageDownloaderLib = require("./lib/imageDownloader");
const { parse } = require("rss-to-json");
const parser = require("xml2json");
const axios = require("axios");

/** Function to convert RSS to JSON (looks for rss field). */
function rssToJson(url) {
  parse(url)
    .then((rss) => {
      // console.log(JSON.stringify(rss, null, 3));
      console.log("*** TO JSON **** ==>\n%s", rss, rss.items);
    })
    .catch((err) => {
      console.log("Error:", err);
    });
}

// rssToJson("https://blog.ethereum.org/feed.xml");
// rssToJson("https://www.thelancet.com/rssfeed/lancet_current.xml");
// rssToJson("https://dev-api.onestepsocial.org/rss-breaking-news/sitemap/lucknow.xml");
//rssToJson("https://dev-api.onestepsocial.org/rss-breaking-news/rss/lucknow.rss");
rssToJson("https://api.raftaar.in/rss-breaking-news/rss/ncr.rss");

/** Function to convert XML to JSON. */
function xmlToJson(url) {
  axios
    .get(url)
    .then((response) => {
      var xml = response.data;
      // console.log("XML:\n", xml)
      var json = parser.toJson(xml);
      console.log("to json ->\n%s", json);
      var parsedJSON = json ? JSON.parse(json) : {};
      // console.log("parsed JSON\n", parsedJSON, null, 3)
    })
    .catch((error) => {
      console.log("Error:", error.message);
    });
}

// xmlToJson("https://dev-api.onestepsocial.org/rss-breaking-news/sitemap/lucknow.xml");

app.listen(port, () => {
  //server starts listening for any attempts from a client to connect at port: {port}
  console.log(`Now listening on port ${port}`);
});

// imageDownloaderLib.downloadAllImages()
// .then((resolve) => {
// const airlines_logos_el = document.getElementById("airlines-logos");
// if (airlines_logos_el) {
//     let html = "";
//     for (let i=0; i<2; i++) {
//         html += `<img src="public/img/airlines_logos/airline_2I" />`;
//     }
//     airlines_logos_el.innerHTML = html;
// }
// });

//Idiomatic expression in express to route and respond to a client request
app.get("/", (req, res) => {
  res.sendFile("index.html", { root: __dirname }); //server responds by sending the index.html file to the client's browser
  //the .sendFile method needs the absolute path to the file,
});
