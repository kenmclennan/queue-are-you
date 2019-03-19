# Objectives

1. -Manage connections & channels across queues-
2. -standardise on async/await, try/catch-
3. make routing configuration easy
4. message handlers should be small functions
   1. should receive a message
   2. return void
   3. they should raise on failure to process messages - this should terminate the message flow
   4. hooks to forward new messages to one or more queues
      1. the configuration should be external to the handler function
5. assert exchanges / queues exist and are configured
6. pub / sub not rpc
7. testable
8. readable
9. observable


Use cases

1. filter a general queue and push valid messages on to a work queue  // <- simplest usecase
2. from work queue route to handler queues for different types of events (e.g. reponse / error from 3rd party) // config heavy
3. delay and reprocess // config light
