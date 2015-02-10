var assert = require('assert');
var config = require('../../../config');
var uviewe = require('../../../middleware/user-viewed-event');

describe('Middleware', function(){
  describe('User Viewed Event', function(){
    it('.getEvaluator({ mode: "once" })', function(){
      var session = {}, locals = {};
      var evaluator = uviewe.getEvaluator({
        name:     'promptSurvey'
      , mode:     'once'
      , threshold: 3
      });

      evaluator( session, locals );

      assert.equal( session.userViews.promptSurvey.value, 1 );
      assert.equal( session.userViews.promptSurvey.wasPrompted, false );
      assert.equal( locals.promptSurvey, false );

      evaluator( session, locals );

      assert.equal( session.userViews.promptSurvey.value, 2 );
      assert.equal( session.userViews.promptSurvey.wasPrompted, false );
      assert.equal( locals.promptSurvey, false );

      evaluator( session, locals );

      assert.equal( session.userViews.promptSurvey.value, 3 );
      assert.equal( session.userViews.promptSurvey.wasPrompted, true );
      assert.equal( locals.promptSurvey, true );

      evaluator( session, locals );

      assert.equal( session.userViews.promptSurvey.value, 4 );
      assert.equal( session.userViews.promptSurvey.wasPrompted, true );
      assert.equal( locals.promptSurvey, false );

      evaluator( session, locals );

      assert.equal( session.userViews.promptSurvey.value, 5 );
      assert.equal( session.userViews.promptSurvey.wasPrompted, true );
      assert.equal( locals.promptSurvey, false );
    });

    it('.getEvaluator({ mode: "recurring" })', function(){
      var session = {}, locals = {};
      var evaluator = uviewe.getEvaluator({
        name:     'promptSurvey'
      , mode:     'recurring'
      , threshold: 3
      });

      evaluator( session, locals );

      assert.equal( session.userViews.promptSurvey.value, 1 );
      assert.equal( locals.promptSurvey, false );

      evaluator( session, locals );

      assert.equal( session.userViews.promptSurvey.value, 2 );
      assert.equal( locals.promptSurvey, false );

      evaluator( session, locals );

      assert.equal( session.userViews.promptSurvey.value, 3 );
      assert.equal( locals.promptSurvey, true );

      evaluator( session, locals );

      assert.equal( session.userViews.promptSurvey.value, 4 );
      assert.equal( locals.promptSurvey, false );

      evaluator( session, locals );

      assert.equal( session.userViews.promptSurvey.value, 5 );
      assert.equal( locals.promptSurvey, false );

      evaluator( session, locals );

      assert.equal( session.userViews.promptSurvey.value, 6 );
      assert.equal( locals.promptSurvey, true );
    });
  });
});