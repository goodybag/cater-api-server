module.exports = {
  "google.com": {
    apiKey: 'AIzaSyBbsgtm6Tqdh3ZyWfRj2Mg_eSZDW8ajLss'
  }

, "aws.amazon.com": {
    id: "AKIAJZTPY46ZWGWU5JRQ"
  , secret: "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"
  }

, "mailgun.com": {
    apiKey: 'key-8ffj79wzb2dda3s6r7u93o4yz07oxxu8'
  , publicApiKey: 'pubkey-45a1-ynm6dw4tmk8egc6izhgqntwir79'
  }

, "mandrill.com": {
    apiKey: 'dpZRzRo0ZAIpfAAQ2JL5pg'
  }

, "twilio.com": {
    account: 'AC4ec9863aecd8248803144972fc51bac0'
  , token: 'f45e26c40cd7481c872c3552676b598b'
  }

, "bit.ly": {
    username:'goodybaginc'
  , apiKey: 'R_174d19bb5c13f986cfa863e18a186441'
  }

, "stripe.com": ({
    dev: {
      secret: 'sk_test_XksbwDuLK1xbpOFaSVLVf9qZ'
    , public: 'pk_test_9N1srz1fVmWGyRAAhmzAA7aP'
    }

  , staging: {
      secret: 'sk_test_XksbwDuLK1xbpOFaSVLVf9qZ'
    , public: 'pk_test_9N1srz1fVmWGyRAAhmzAA7aP'
    }

  , production: {
      secret: 'sk_live_kjAFUHK2tYc6BRHRyeMlZPON'
    , public: 'pk_live_kShOkv0NSx9Lj1qWGqxAXotN'
    }
  })[ process.env.GB_ENV ]

, "rollbar.com": ({
    production: { accessToken: 'b85e21df4a1746b49d471441dfd70fa0' }
  , staging:    { accessToken: '8d240c636751439791b214c9ec8cf8af' }
  , india:      { accessToken: '8d240c636751439791b214c9ec8cf8af' }
  , dev:        { accessToken: 'c7f82820e02c4bd7a759015518948ce3' }
  })[ process.env.GB_ENV ]

, "intercom.io": ({
    dev: {
      apiSecret: 'A4NvND_qEf-ksKYhVw-GduUS2ruW2NlC39murXx2'
    , appId: 'qsetwlny'
    }

  , staging: {
      apiSecret: 'tumIlUFE__wGfvVxtAyESXRMroQJAz5csfMKULAY'
    , appId: '6bxgiurw'
    }

  , production: {
      apiSecret: '5I1eNUY_F6HKl_Gb15965fr5VgGfNlwny7WmyKZx'
    , appId: '13s9qu57'
    }
  })[ process.env.GB_ENV ]

, "iron.io": ({
    production: {
      token: 'vr52EAPD-oYRDtZzsqYd0eoDLkI'
    , projectId: '526990cba2b8ed000500002e'
    }

  , staging: {
      token: 'M-NmfDgtD66MCHYKTVS3m15BbSA'
    , projectId: '526990bcf2d1570009000035'
    }

  , india: {
      token: 'M-NmfDgtD66MCHYKTVS3m15BbSA'
    , projectId: '526990bcf2d1570009000035'
    }

  , dev: {
      token: '_2rd5UzCv7_-chOc4rDZ0Y7y74A'
    , projectId: '526990a7f2d1570005000038'
    }
  })[ process.env.GB_ENV ]

, "balancedpayments.com": {
    secret: "ak-prod-OmLnG7ftnzB145uM4Ycu4YIE0mgPx4eE"
  , marketplaceUri: "/v1/marketplaces/MPwgAAAdaGmk4BhrmL0qkRM"
  }

, "filepicker.com": {
    key: 'AF52P8LtHSd6VMD07XdOQz'
  }

, "yelp.com": {
    token: 'p2aFEzA20-W4kFttJqiATW3fyq7AUyW6'
  , tokenSecret: 'gik4eZYy1PB8Fna4TMqIauXUGKs'
  , consumerKey: '6F-LMALFlGTckzlBfg03fA'
  , consumerSecret: 'OmclTS9gpl03vksQvA_Cr7OUPU4'
  }
};