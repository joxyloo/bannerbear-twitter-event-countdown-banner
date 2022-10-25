require('dotenv').config();
const fetch = require('node-fetch');
const { Bannerbear } = require('bannerbear');
const Twitter = require('twitter');

// var CronJob = require('cron').CronJob;
// var job = new CronJob(
// 	'0 0 * * *', // every day at midnight
// 	function() {
// 		start(); 
// 	},
// 	null,
// 	true,
// 	null,
//   null,
//   null,
//   new Date().getTimezoneOffset()/-60 //utcOffset
// );

const BB_TEMPLATE_UID = 'E9YaWrZM2VJj5nRd74';
const dateOptions = { year: 'numeric', month: 'long', day: 'numeric' };

async function start() {

    const eventDate = new Date(2022, 9, 20); // hardcode or pull event date from a data source - note that month starts from 0
    const days = calculateDays(new Date(), eventDate) || 0;
    var countdownText = (days > 0) ? `${days} days left` : 'Live now!' ;

    const bannerUrl = await generateBanner(eventDate.toLocaleDateString("en-US", dateOptions), countdownText);

    if (bannerUrl) {
        await updateTwitterBanner(bannerUrl);
    }

}

function calculateDays(today, eventDate){

   const difference = eventDate.getTime() - today.getTime();

   return Math.ceil(difference / (1000 * 3600 * 24)); // convert to days
}

function generateBanner(evetDateText, countdownText) {

  return new Promise(async (resolve, reject) => {

    const bb = new Bannerbear(process.env.BB_API);

    const images = await bb.create_image(
      BB_TEMPLATE_UID,
      {
        modifications: [
          {
            name: 'countdown',
            text: countdownText,
          },
          {
            name: 'date',
            text: evetDateText,
          },
        ],
      },
      true
    );

    resolve(images?.image_url_jpg);
  });
}

async function updateTwitterBanner(bannerUrl) {

  const twitter = new Twitter({
    consumer_key: process.env.TWITTER_CONSUMER_KEY,
    consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
    access_token_key: process.env.TWITTER_ACCESS_TOKEN_KEY,
    access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
  });

  const bannerImage = await fetch(bannerUrl);
  const buffer = await bannerImage.arrayBuffer();
  const bannerString = Buffer.from(buffer).toString('base64');

  twitter.post(
    'account/update_profile_banner', // endpoint
    { banner: bannerString }, // param
    function (error, tweet, response) { //callback

      if (error) throw error;
      console.log(tweet); // Tweet body.
      console.log(response); // Raw response object.
    }
  );
}
