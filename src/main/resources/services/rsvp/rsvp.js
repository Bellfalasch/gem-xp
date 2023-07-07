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

exports.post = function (req) {
  /*
  if (1 === 1)
  {return {
      body: {
        message: `Test, we're in the POST`,
        payload: req,
        body: JSON.parse(req.body)
      },
      contentType: "application/json"
    };
  }*/
  const body = req.body;
  if (!body) {
    return {
      body: {
        message: `Invalid body payload sent`,
        newId: undefined,
        success: false
      },
      contentType: "application/json"
    };
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
  const eventExists = gemRepo.exists(`/${eventId}`);/*
  if (eventExists) {
    return {
      body: {
        message: `Event exists? ${eventExists}`
      },
      contentType: "application/json"
    }
  }*/

  if (!eventExists) {
    //log.info(`K, so we didn't find event, let's run a create()`)
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
  const userExists = gemRepo.exists(`/${eventId}/${user.email}`);
  if (!userExists) {
    const result = contextLib.run(
      runAsAdmin,
      () => {
        return gemRepo.create({
          _name: user.email,
          _parentPath: eventId,
          name: user.name,
          email: user.email,
          rsvp: user.rsvp,
          allergy: user.allergy,
          eventId: eventId // redundant data, but when making sure data ends up in the right event, it might be nice to store this double to make debugging easier
        })
      }
    );

    return {
      body: {
        message: `RSVP registered! ${result._id}`,
        newId: result._id,
        success: true
      },
      contentType: "application/json"
    }
  } else {
    return {
      body: {
        message: `Sorry Mac, your e-mail is already registered!`,
        newId: undefined,
        success: false
      },
      contentType: "application/json"
    }
  }
}

exports.get = function (req) {
  const eventId = req.params.eventId || null;
  if (!eventId) {
    return {
      body: {
        message: `Please send a eventId using GET to this endpoint`,
        success: false
      },
      contentType: "application/json"
    }
  }

  const eventExists = gemRepo.exists(`/${eventId}`);
  if (!eventExists) {
    return {
      body: {
        message: `Event not found, assuming no one are attending yet.`,
        participants: 0
      },
      contentType: "application/json"
    }
  } else {
    const result = gemRepo.query({
        query: `eventId = '${eventId}'`
    });
    if (result) {
      return {
        body: {
          message: `Found event and participants on it.`,
          participants: result.total
        },
        contentType: "application/json"
      }
    } else {
      return {
        body: {
          message: `No RSVPs for this event found, assuming no one are attending yet.`,
          participants: 0
        },
        contentType: "application/json"
      }
    }
  }
}