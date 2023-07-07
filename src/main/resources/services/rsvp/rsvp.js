const nodeLib = require('/lib/xp/node');
// https://developer.enonic.com/docs/xp/stable/api/lib-node

// Service documentation: https://developer.enonic.com/docs/xp/stable/runtime/engines/http-service
// It responds here: http://localhost:8080/admin/site/preview/moviedb/draft/gem/test-event/_/service/com.gjensidige.internal.gem/rsvp

const gemRepo = nodeLib.connect({
  repoId: "com.gjensidige.internal.gem",
  branch: "master"
});

exports.post = function (req) {
  const eventId = req.params.eventId || null;
  const uniqueName = 'nerd2';
  const uniquePath = `/${uniqueName}`;

  // Checking if a node exists by path
  const dataExists = gemRepo.exists(uniquePath);
  if (dataExists) {
      log.info('Node exists - skip creation');
  } else {
    log.info('Node does not exist - create it!');
    
    var result = gemRepo.create({
      _name: uniqueName,
      displayName: 'Carpenter and IT expert',
      likes: 'Plywood',
      numberOfUselessGadgets: 123,
      eventId: eventId
    });
    // TODO: store RSVP using the data you need, attach event ID to know which event.
    // Name of person, timestamp, e-mail, attending/not attending, allergy info ... more? eventId
    log.info(JSON.stringify(result,null,4));

    return {
      body: {
        message: `RSVP registered! ${result._id}`,
        newId: result._id,
        success: true
      },
      contentType: "application/json"
    }
  }

  return {
    body: {
      message: `Sorry Mac, node already exists`,
      newId: undefined,
      success: false
    },
    contentType: "application/json"
  }
}
