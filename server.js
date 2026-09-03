const http = require( 'http' ),
      fs   = require( 'fs' ),
      mime = require( 'mime' ),
      dir  = 'public/',
      port = 3000

let nextId = 3
const appdata = []


function computeDerived( data ) {

  const score = parseInt( data.score, 10 ) || 0
  const duration = Math.max( parseInt( data.duration, 10 ) || 1, 1 )
  const pps = score / duration

  let rankTier = 'C Rank'
  if ( pps >= 12 ) {

    rankTier = 'S Rank'
  }
  else if ( pps >= 8 ) {

    rankTier = 'A Rank'
  }
  else if ( pps >= 4 ) {

    rankTier = 'B Rank'
  }

  return {
    pps: pps.toFixed( 2 ),
    rankTier
  }
}


const server = http.createServer( function( request, response ) {

  if( request.method === 'GET' ) {

    handleGet( request, response )    
  }
  else if ( request.method === 'POST' ){

    handlePost( request, response ) 
  }
})


const handleGet = function( request, response ) {

  const filename = dir + request.url.slice( 1 ) 

  if( request.url === '/' ) {

    sendFile( response, 'public/index.html' )
  }
  else if( request.url === '/data' ) {

    response.writeHead( 200, "OK", { 'Content-Type': 'application/json' } )
    response.end( JSON.stringify( appdata ) )
  }
  else {
    sendFile( response, filename )
  }
}


const handlePost = function( request, response ) {
  let dataString = ''

  request.on( 'data', function( data ) {

      dataString += data 
  })

  request.on( 'end', function() {

    const payload = JSON.parse( dataString )

    if( request.url === '/submit' ) {

      const derived = computeDerived( payload )
      appdata.push({

        id: nextId++,
        username: payload.username || 'Anonymous',
        score: parseInt( payload.score, 10 ) || 0,
        duration: parseInt( payload.duration, 10 ) || 1,
        pps: derived.pps,
        rankTier: derived.rankTier
      })
    } 
    else if( request.url === '/edit' ) {

      const targetId = parseInt( payload.id, 10 )
      const index = appdata.findIndex( item => item.id === targetId )

      if( index !== -1 ) {

        const derived = computeDerived( payload )
        appdata[ index ] = {

          id: targetId,
          username: payload.username,
          score: parseInt( payload.score, 10 ) || 0,
          duration: parseInt( payload.duration, 10 ) || 1,
          pps: derived.pps,
          rankTier: derived.rankTier
        }
      }
    } 
    else if( request.url === '/delete' ) {

      const targetId = parseInt( payload.id, 10 )
      const index = appdata.findIndex( item => item.id === targetId )

      if( index !== -1 ) {

        appdata.splice( index, 1 )
      }
    }

    response.writeHead( 200, "OK", {'Content-Type': 'application/json' })
    response.end( JSON.stringify( appdata ) )
  })
}

const sendFile = function( response, filename ) {

   const type = mime.getType( filename ) 

   fs.readFile( filename, function( err, content ) {

     if( err === null ) {

       response.writeHeader( 200, { 'Content-Type': type })
       response.end( content )

     }
     else{

       response.writeHeader( 404 )
       response.end( '404 Error: File Not Found' )

     }
   })
}

server.listen( process.env.PORT || port )