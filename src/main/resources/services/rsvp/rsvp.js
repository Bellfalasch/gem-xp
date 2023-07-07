const nodeLib = require('/lib/xp/node');
// https://developer.enonic.com/docs/xp/stable/api/lib-node
const contextLib = require('/lib/xp/context');
// https://developer.enonic.com/docs/xp/stable/api/lib-context

// Service documentation: https://developer.enonic.com/docs/xp/stable/runtime/engines/http-service
// It responds here: http://localhost:8080/admin/site/preview/moviedb/draft/gem/test-event/_/service/com.gjensidige.internal.gem/rsvp

const gemRepo = nodeLib.connect({
  repoId: "com.gjensidige.internal.gem",
  branch: "master",
  user: {
    login: 'su',
    idProvider: 'system'
  },
  principals: ['role:system.admin']
});
const runAsAdmin = {
  //repository: "com.gjensidige.internal.gem",
  //branch: "master",
  user: {
    login: 'su',
    idProvider: 'system'
  },
  principals: ['role:system.admin']
}
let response = {
  body: {
    message: `Unknown error`,
    success: false
  },
  contentType: "application/json"
};

exports.post = function (req) {
  /*
    return {
      body: {
        message: `Test, we're in the POST`,
        payload: req, // Use this to see entire request object
        body: JSON.parse(req.body) // Use this so see the payload sent
      },
      contentType: "application/json"
    };
  */
  const body = req.body;
  if (!body) {
    response.body.message = `Invalid body payload sent`,
    response.body.newId = undefined;
    return response;
  }
  const bodyObject = JSON.parse(body);
  const eventId = bodyObject.eventId;
  const user = {
    name: bodyObject.name,
    email: bodyObject.email,
    rsvp: bodyObject.rsvp,
    allergy: bodyObject.allergy,
  };

  // Checking if event exists
  const eventExists = gemRepo.exists(`/${eventId}`);

  if (!eventExists) {
    const result = contextLib.run(
      runAsAdmin,
      () => {
        return gemRepo.create({
          _name: eventId,
          displayName: `Event ID: ${eventId}`
        })
      }
    );/*
    return {
      body: {
        message: `Just created an event, all happy days`
      },
      contentType: "application/json"
    }*/
  }

  // Check if user entry exists under this event (based on e-mail)
  const rsvpExists = gemRepo.exists(`/${eventId}/${user.email}`);
  if (!rsvpExists) {
    const result = contextLib.run(
      runAsAdmin,
      () => {
        return gemRepo.create({
          _name: user.email,
          _parentPath: `/${eventId}`,
          name: user.name,
          email: user.email,
          rsvp: user.rsvp,
          allergy: user.allergy,
          eventId: eventId // redundant data, but when making sure data ends up in the right event, it might be nice to store this double to make debugging easier
        })
      }
    );

    response.body.message = `RSVP registered! Added inside Event`;
    response.body.newId = result._id;
    response.body.eventId = eventId;
    response.body.success = true;
    return response;
  } else {
    response.body.message = `Sorry Mac, your e-mail is already registered!`;
    response.body.newId = undefined;
    return response;
  }
}

exports.get = function (req) {
  const eventId = req.params.eventId || null;
  if (!eventId) {
    response.body.message = `Please send a eventId using GET to this endpoint`;
    return response;
  }

  const eventExists = gemRepo.exists(`/${eventId}`);
  if (!eventExists) {
    response.body.message = `Event not found, assuming no one are attending yet.`;
    response.body.participants = 0;
    return response;
  } else {
    const result = gemRepo.query({
      query: `eventId = '${eventId}'`
    });
    if (result) {
      response.body.message = `Found event and participants on it.`;
      response.body.participants = result.total;
      return response;
    } else {
      response.body.message = `No RSVPs for this event found, assuming no one are attending yet.`;
      response.body.participants = 0;
      return response;
    }
  }
}