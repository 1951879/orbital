
import { createServer } from 'http';
import { Server } from 'socket.io';

const httpServer = createServer((req, res) => {
  if (req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Orbital Sim Server Online');
  }
});

const io = new Server(httpServer, {
  cors: {
    origin: "*", 
    methods: ["GET", "POST"]
  },
  transports: ['websocket', 'polling'] 
});

// --- PERSISTENT LOBBIES ---
// Creating a few default "Planets" for people to join
const generateRooms = () => {
    const r = {};
    
    // 1. Terra Nova (Small, Balanced)
    r['room_1'] = {
        id: 'room_1',
        name: 'Terra Nova',
        mission: 'free',
        seed: 12345,
        params: {
            planetRadius: 50,
            waterLevel: 0.33,
            mountainScale: 1.0,
            mountainFrequency: 2.5,
            forestDensity: 0.45,
            desertDensity: 0.3,
            plantSize: 0.3,
        },
        players: {},
        maxPlayers: 8
    };

    // 2. Goliath (Massive)
    r['room_2'] = {
        id: 'room_2',
        name: 'Goliath Prime',
        mission: 'free',
        seed: 98765,
        params: {
            planetRadius: 120,
            waterLevel: 0.2,
            mountainScale: 1.2,
            mountainFrequency: 3.5,
            forestDensity: 0.2,
            desertDensity: 0.6,
            plantSize: 0.3,
        },
        players: {},
        maxPlayers: 12
    };

    // 3. Aqua (Tiny, Water World)
    r['room_3'] = {
        id: 'room_3',
        name: 'Oceanus',
        mission: 'free',
        seed: 55555,
        params: {
            planetRadius: 35,
            waterLevel: 0.7,
            mountainScale: 0.6,
            mountainFrequency: 1.5,
            forestDensity: 0.1,
            desertDensity: 0.0,
            plantSize: 0.3,
        },
        players: {},
        maxPlayers: 6
    };
    
    return r;
};

const rooms = generateRooms();

// Helper to broadcast lobby list to everyone (usually in the 'lobby' channel)
const broadcastLobbyList = () => {
    const list = Object.values(rooms).map(r => ({
        id: r.id,
        name: r.name,
        playerCount: Object.keys(r.players).length,
        maxPlayers: r.maxPlayers,
        mission: r.mission,
        params: r.params
    }));
    io.emit('lobbyList', list); // Emit to everyone connected
};

io.on('connection', (socket) => {
  console.log('Pilot connected:', socket.id);
  
  // Default: Player is in "Limbo" or "Lobby" channel, receiving list updates
  // They are NOT in a specific room object yet.
  
  socket.emit('lobbyList', Object.values(rooms).map(r => ({
        id: r.id,
        name: r.name,
        playerCount: Object.keys(r.players).length,
        maxPlayers: r.maxPlayers,
        mission: r.mission,
        params: r.params
  })));

  // Join a specific Planet
  socket.on('joinRoom', (roomId) => {
      const room = rooms[roomId];
      if (!room) return;
      if (Object.keys(room.players).length >= room.maxPlayers) return; // Full

      // Leave previous room if any (though usually client sends leave first)
      const currentRooms = Array.from(socket.rooms);
      currentRooms.forEach(r => {
          if (r !== socket.id) socket.leave(r);
      });

      socket.join(roomId);
      
      // Initialize Player in Room State
      room.players[socket.id] = {
          id: socket.id,
          pos: [0, room.params.planetRadius + 20, 0], // Spawn high
          quat: [0, 0, 0, 1],
          type: 'interceptor',
          throttle: 0.5,
          timestamp: Date.now()
      };

      // 1. Send World Data for this room to the joining player
      socket.emit('worldInit', { seed: room.seed, params: room.params });

      // 2. Notify others in room
      socket.to(roomId).emit('playerJoined', { id: socket.id, ...room.players[socket.id] });

      // 3. Send existing players to new joiner
      socket.emit('currentPlayers', room.players);
      
      // 4. Update Global Lobby Counts
      broadcastLobbyList();
      
      console.log(`${socket.id} joined ${room.name}`);
  });

  socket.on('leaveRoom', () => {
      // Find which room they were in
      const currentRooms = Array.from(socket.rooms);
      currentRooms.forEach(roomId => {
          if (rooms[roomId] && rooms[roomId].players[socket.id]) {
              delete rooms[roomId].players[socket.id];
              socket.to(roomId).emit('playerLeft', socket.id);
              socket.leave(roomId);
              console.log(`${socket.id} left ${rooms[roomId].name}`);
          }
      });
      broadcastLobbyList();
  });

  socket.on('latency', (fn) => {
    if (fn) fn();
  });

  socket.on('telemetry', (data) => {
    // Find room logic: iterating isn't efficient but robust enough for small scale
    // Optimization: Store socket.roomId on socket object
    // For now, rely on socket.rooms set
    const roomIds = Array.from(socket.rooms);
    // 0 is usually socket.id, 1 is the room
    const roomId = roomIds.find(r => r !== socket.id && rooms[r]);
    
    if (roomId && rooms[roomId]) {
        const room = rooms[roomId];
        const p = room.players[socket.id];
        if (p) {
            p.pos = data.pos;
            p.quat = data.quat;
            p.type = data.type;
            p.throttle = data.throttle;
            p.timestamp = Date.now();

            // Relay via UDP-like volatile
            socket.to(roomId).volatile.emit('remoteTelemetry', {
                id: socket.id,
                pos: data.pos,
                quat: data.quat,
                type: data.type,
                throttle: data.throttle
            });
        }
    }
  });

  socket.on('disconnect', () => {
    console.log('Pilot disconnected:', socket.id);
    // Cleanup from any room
    Object.values(rooms).forEach(room => {
        if (room.players[socket.id]) {
            delete room.players[socket.id];
            io.to(room.id).emit('playerLeft', socket.id);
        }
    });
    broadcastLobbyList();
  });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`Orbital Sim Uplink established on port ${PORT}`);
});
