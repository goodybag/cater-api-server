module.exports = {
  // Lookup service
  "google.com": {
    type: 'lookup-service'
  , scope: 'global'
  , apiKey: 'AIzaSyBbsgtm6Tqdh3ZyWfRj2Mg_eSZDW8ajLss'
  }

, "aws.amazon.com": {
    type: 'storage'
  , scope: 'global'
  , id: "AKIAJZTPY46ZWGWU5JRQ"
  , secret: "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"
  }

, "mailgun.com": {
    type: 'messaging'
  , scope: 'global'
  , apiKey: 'key-8ffj79wzb2dda3s6r7u93o4yz07oxxu8'
  , publicApiKey: 'pubkey-45a1-ynm6dw4tmk8egc6izhgqntwir79'
  }

, "mandrill.com": {
    type: 'messaging'
  , scope: 'global'
  , apiKey: 'dpZRzRo0ZAIpfAAQ2JL5pg'
  }

, "twilio.com": {
    type: 'messaging'
  , scope: 'global'
  , account: 'AC4ec9863aecd8248803144972fc51bac0'
  , token: 'f45e26c40cd7481c872c3552676b598b'
  }

, "bit.ly": {
    type: 'mapping'
  , scope: 'global'
  , username:'goodybaginc'
  , apiKey: 'R_174d19bb5c13f986cfa863e18a186441'
  }

, "stripe.com": ({
    dev: {
      type: 'transaction'
    , scope: 'global'
    , secret: 'sk_test_XksbwDuLK1xbpOFaSVLVf9qZ'
    , public: 'pk_test_9N1srz1fVmWGyRAAhmzAA7aP'
    }

  , staging: {
      type: 'transaction'
    , scope: 'global'
    , secret: 'sk_test_XksbwDuLK1xbpOFaSVLVf9qZ'
    , public: 'pk_test_9N1srz1fVmWGyRAAhmzAA7aP'
    }

  , production: {
      type: 'transaction'
    , scope: 'global'
    , secret: 'sk_live_kjAFUHK2tYc6BRHRyeMlZPON'
    , public: 'pk_live_kShOkv0NSx9Lj1qWGqxAXotN'
    }
  })[ process.env.GB_ENV ]

, "dropoff.com": {
    type: 'messaging'
  , scope: 'global'
  , publicKey: require('./dropoff').publicKey
  , privateKey: require('./dropoff').privateKey
  }

, "rollbar.com": ({
    type: 'reporting'
  , scope: 'global'
  , accessToken: ({
      production: 'b85e21df4a1746b49d471441dfd70fa0'
    , staging:    '8d240c636751439791b214c9ec8cf8af'
    , india:      '8d240c636751439791b214c9ec8cf8af'
    , dev:        'c7f82820e02c4bd7a759015518948ce3'
    })
  })[ process.env.GB_ENV ]

, "intercom.io": ({
    dev: {
      type: 'communication'
    , scope: 'global'
    , apiSecret: 'A4NvND_qEf-ksKYhVw-GduUS2ruW2NlC39murXx2'
    , appId: 'qsetwlny'
    }

  , staging: {
      type: 'communication'
    , scope: 'global'
    , apiSecret: 'tumIlUFE__wGfvVxtAyESXRMroQJAz5csfMKULAY'
    , appId: '6bxgiurw'
    }

  , production: {
      type: 'communication'
    , scope: 'global'
    , apiSecret: '5I1eNUY_F6HKl_Gb15965fr5VgGfNlwny7WmyKZx'
    , appId: '13s9qu57'
    }
  })[ process.env.GB_ENV ]

, "iron.io": ({
    production: {
      type: 'messaging'
    , scope: 'global'
    , token: 'vr52EAPD-oYRDtZzsqYd0eoDLkI'
    , projectId: '526990cba2b8ed000500002e'
    }

  , staging: {
      type: 'messaging'
    , scope: 'global'
    , token: 'M-NmfDgtD66MCHYKTVS3m15BbSA'
    , projectId: '526990bcf2d1570009000035'
    }

  , india: {
      type: 'messaging'
    , scope: 'global'
    , token: 'M-NmfDgtD66MCHYKTVS3m15BbSA'
    , projectId: '526990bcf2d1570009000035'
    }

  , dev: {
      type: 'messaging'
    , scope: 'global'
    , token: '_2rd5UzCv7_-chOc4rDZ0Y7y74A'
    , projectId: '526990a7f2d1570005000038'
    }
  })[ process.env.GB_ENV ]

, "balancedpayments.com": ({
    production: {
      type: 'transaction'
    , scope: 'global'
    , secret: "ak-prod-OmLnG7ftnzB145uM4Ycu4YIE0mgPx4eE"
    , marketplaceUri: "/v1/marketplaces/MPwgAAAdaGmk4BhrmL0qkRM"
    }

  , dev: {
      type: 'transaction'
    , scope: 'global'
    , secret: "ak-test-2G892W7NuiD6qupYcICGSckp457NQDPoO"
    , marketplaceUri: "/v1/marketplaces/TEST-MP5E2WUxpmSwL432vw6CoWNv"
    }
  })[ process.env === 'production' ? 'production' : 'dev' ]

, "filepicker.com": {
    type: 'storage'
  , scope: 'global'
  , key: 'AF52P8LtHSd6VMD07XdOQz'
  }

, "yelp.com": {
    type: 'lookup-service'
  , scope: 'global'  
  , token: 'p2aFEzA20-W4kFttJqiATW3fyq7AUyW6'
  , tokenSecret: 'gik4eZYy1PB8Fna4TMqIauXUGKs'
  , consumerKey: '6F-LMALFlGTckzlBfg03fA'
  , consumerSecret: 'OmclTS9gpl03vksQvA_Cr7OUPU4'
  }

, "loggly.com": {
    type: 'logging'
  , scope: 'global'
  , token: '75cd986d-4598-424f-bb6f-d128499b2d99'
  , subdomain: 'goodybag'
  }
};