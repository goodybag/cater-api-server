module.exports = {
  "static-assets": {
    credentials: 'aws.amazon.com'
  , s3: {
      bucket: 'cater-cdn-{env}'
                .replace('{env}', ({
                  dev:        'dev'
                , test:       'dev'
                , staging:    'staging'
                , production: 'prod'
                , india:      'prod'
                })[ process.env.GB_ENV ])
    }
  }

, "receipts": {
    credentials: 'aws.amazon.com'
  , s3: {
      bucket: '{prefix}receipts.goodybag.com'
                .replace('{prefix}', ({
                  dev:        'dev'
                , test:       'dev'
                , staging:    'staging'
                , production: ''
                , india:      'staging'
                })[ process.env.GB_ENV ])
    }
  }

, "payment-summaries": {
    credentials: 'aws.amazon.com'
  , s3: {
      bucket: '{prefix}pms.goodybag.com'
                .replace('{prefix}', ({
                  dev:        'dev'
                , test:       'dev'
                , staging:    'staging'
                , production: 'prod'
                , india:      'staging'
                })[ process.env.GB_ENV ])
    }
  }

, "invoices": {
    credentials: 'aws.amazon.com'
  , s3: {
      bucket: 'invoices-{env}.goodybag.com'
                .replace('{env}', ({
                  dev:        'dev'
                , test:       'dev'
                , staging:    'staging'
                , production: 'prod'
                , india:      'staging'
                })[ process.env.GB_ENV ])
    }
  }
};