/**
 * @fileoverview Tests for the is-live filter.
 *
 * These tests use proxyquire to stub out the site.env object that is-live
 * relies on.
 *
 * Note that even though we write our dates as `date: 2020-01-02` in our YAML
 * frontmatter, eleventy will convert these to JavaScript Date objects before
 * handing the post to this filter. Therefore the tests work with actual
 * JavaScript dates.
 */

const assert = require('assert');
const proxyquire = require('proxyquire');

describe('is-live', function () {
  let siteStub;
  let post;
  let isLive;
  const {
    isScheduledForTheFuture,
  } = require('../../../../../src/site/_filters/is-live');

  beforeEach(function () {
    post = {date: new Date(), data: {}, inputPath: '/path/to/file.md'};
    siteStub = {env: 'prod'};
    isLive = proxyquire('../../../../../src/site/_filters/is-live', {
      '../_data/site': siteStub,
    }).isLive;
  });

  afterEach(function () {
    post = null;
    siteStub = null;
    isLive = null;
  });

  it('should throw if the post does not have a date', function () {
    post.date = null;
    // nb. to test throws in mocha you have to call the fn within another fn.
    assert.throws(() => isLive(post), /did not specify a date/);
  });

  it('should throw if the post does not have a data object', function () {
    post.data = null;
    // nb. to test throws in mocha you have to call the fn within another fn.
    assert.throws(() => isLive(post), /does not have a data object/);
  });

  it('should always return true in the dev environment', function () {
    post.data.draft = true;
    siteStub.env = 'dev';
    // nb. to update a destructured property you have to run proxyquire again.
    isLive = proxyquire('../../../../../src/site/_filters/is-live', {
      '../_data/site': siteStub,
    }).isLive;
    const actual = isLive(post);
    assert.strictEqual(actual, true);
  });

  it('should return false if the post has a future date (scheduled posts)', function () {
    // set the post date to 1 day in the future.
    post.date.setDate(post.date.getDate() + 1);
    post.data.scheduled = true;
    const actual = isLive(post);
    assert.strictEqual(actual, false);
  });

  it('should return true if the post has a past date (scheduled posts)', function () {
    // set the post date to 1 day in the past.
    post.date.setDate(post.date.getDate() - 1);
    post.data.scheduled = true;
    const actual = isLive(post);
    assert.strictEqual(actual, true);
  });

  it('should return false if the post is a draft', function () {
    post.data.draft = true;
    const actual = isLive(post);
    assert.strictEqual(actual, false);
  });

  it('should return true if the post is not a draft', function () {
    const actual = isLive(post);
    assert.strictEqual(actual, true);
  });

  it('should return false if the post has a past date but is a draft', function () {
    // set the post date to 1 day in the past.
    post.date.setDate(post.date.getDate() - 1);
    post.data.scheduled = true;
    post.data.draft = true;
    const actual = isLive(post);
    assert.strictEqual(actual, false);
  });

  describe('isScheduledForTheFuture', function () {
    it('should throw if now argument is not a Date', function () {
      assert.throws(
        () => isScheduledForTheFuture(post, 0),
        /must by a Date object/,
      );
    });

    it(`should return true if it's before 15:00 UTC on the publish date`, function () {
      const date = new Date();
      date.setUTCHours(14, 0, 0, 0);
      const actual = isScheduledForTheFuture(post, date);
      assert.strictEqual(actual, true);
    });

    it(`should return false if it's exactly 15:00 UTC on the publish date`, function () {
      const date = new Date();
      date.setUTCHours(15, 0, 0, 0);
      const actual = isScheduledForTheFuture(post, date);
      assert.strictEqual(actual, false);
    });

    it(`should return false if it's after 15:00 UTC on the publish date`, function () {
      const date = new Date();
      date.setUTCHours(15, 1, 0, 0);
      const actual = isScheduledForTheFuture(post, date);
      assert.strictEqual(actual, false);
    });
  });
});
