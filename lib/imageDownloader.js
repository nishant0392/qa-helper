const fs = require("fs");
const path = require("path");
const axios = require("axios");
const AIRLINES_DB = require("../public/js/airlines_db");

var stream; // Write stram

/** WRITE the function here to GENERATE all the image URLs that are to be downloaded in bulk. */
function bulkUrlGenerator() {
  var listOfImageUrls = [];

  /**  **  Write your logic here  ** **/

  if (AIRLINES_DB) {
    for (var i = 0; i < AIRLINES_DB.length; i++) {
      if (AIRLINES_DB[i].iata_code) {
        var airline_iata = AIRLINES_DB[i].iata_code
          .substring(0, 2)
          .toUpperCase();
        var url = `https://assets.duffel.com/img/airlines/for-light-background/full-color-lockup/${airline_iata.toUpperCase()}.svg`;
        listOfImageUrls.push({
          url,
          iata_code: airline_iata,
          icao_code: AIRLINES_DB[i].icao_code,
        });
      }
    }
  }

  /**  **  Logic ENDS here ** **/

  // console.log('List of Image URLs: \n', listOfImageUrls)
  return listOfImageUrls;
}

/** Function to download a single image on the specified path with the given filename. */
async function downloadImage(url, dirPath, filename) {
  axios
    .get(url, { responseType: "arraybuffer" })
    .then((response) => {
      fs.writeFile(path.join(dirPath, filename), response.data, (err) => {
        if (err) throw err;
        console.log("Image downloaded successfully!");
      });
    })
    .catch((error) => {
      console.log("Error:", error.message);
      // Write logs
      var iata_code = url.substring(url.length - 6, url.length - 4);
      stream.write(`${iata_code}, `);
    });
}

/** ****  Function to download all images in a bulk  **** */
const downloadAllImages = async () => {
  // generate bulk image urls to download
  const allImageURLs = bulkUrlGenerator();

  // 'public' directory
  let publicDir = path.join(__dirname, "..", "public");

  // The path of the directory to save the images
  var dir_imageFiles = `${publicDir}/img/airlines_logos`;

  // Create a directory if it doesn't exist
  if (!fs.existsSync(dir_imageFiles)) {
    fs.mkdirSync(dir_imageFiles, { recursive: true });
  }

  // create a Write Stream
  stream = fs.createWriteStream(path.join(publicDir, "logs", "logs.txt"), {
    flags: "a",
  });
  stream.write(`Logo missing for following IATA codes: \n`); // start the log

  for (let i = 0; i < allImageURLs.length; i++) {
    const imgInfo = allImageURLs[i];
    downloadImage(
      imgInfo.url,
      dir_imageFiles,
      "airline_" + imgInfo.iata_code + ".svg",
    ).catch((error) => console.log("Err:", error.message));
  }
};

// downloadAllImages();

//  https://daisycon.io/images/airline/?width=300&height=150&color=ffffff&iata=af

module.exports = {
  downloadAllImages: downloadAllImages,
};
