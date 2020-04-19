const Peer = window.Peer;

(async function main() {
  const localVideo = document.getElementById('js-local-stream');
  const joinTrigger = document.getElementById('js-join-trigger');
  const leaveTrigger = document.getElementById('js-leave-trigger');
  const remoteVideos = document.getElementById('js-remote-streams');
  const roomId = document.getElementById('js-room-id');
  const roomMode = document.getElementById('js-room-mode');
  const userName = document.getElementById('js-user-name');
  const userNameBtn = document.getElementsByName('js-user-name-btn');
  const localText = document.getElementById('js-local-text');
  const sendTrigger = document.getElementById('js-send-trigger');
  const messages = document.getElementById('js-messages');
  const meta = document.getElementById('js-meta');
  const sdkSrc = document.querySelector('script[src*=skyway]');
  const now = new Date();
  const HH = now.getHours();
  const MM = now.getMinutes();
  const SS = now.getSeconds();

  meta.innerText = `
    UA: ${navigator.userAgent}
    SDK: ${sdkSrc ? sdkSrc.src : 'unknown'}
  `.trim();

//  const getRoomModeByHash = () => (location.hash === '#sfu' ? 'sfu' : 'mesh');

//  roomMode.textContent = 'sfu'; // getRoomModeByHash();
//  window.addEventListener(
//    'hashchange',
//    () => (roomMode.textContent = getRoomModeByHash())
//  );

  userNameBtn[0].addEventListener('click', () => { userName.value = userNameBtn[0].value;});
  userNameBtn[1].addEventListener('click', () => { userName.value = userNameBtn[1].value;});
  userNameBtn[2].addEventListener('click', () => { userName.value = userNameBtn[2].value;});
  userNameBtn[3].addEventListener('click', () => { userName.value = userNameBtn[3].value;});
  userNameBtn[4].addEventListener('click', () => { userName.value = userNameBtn[4].value;});
  userNameBtn[5].addEventListener('click', () => { userName.value = userNameBtn[5].value;});
  userNameBtn[6].addEventListener('click', () => { userName.value = userNameBtn[6].value;});
  userNameBtn[7].addEventListener('click', () => { userName.value = userNameBtn[7].value;});
  userNameBtn[8].addEventListener('click', () => { userName.value = userNameBtn[8].value;});

  const localStream = await navigator.mediaDevices
    .getUserMedia({
      audio: true,
      video: true,
    })
    .catch(console.error);

  // Render local stream
  localVideo.muted = true;
  localVideo.srcObject = localStream;
  localVideo.playsInline = true;
  await localVideo.play().catch(console.error);

  // eslint-disable-next-line require-atomic-updates
  const peer = (window.peer = new Peer({
    key: window.__SKYWAY_KEY__,
    debug: 3,
  }));

  // Register join handler
  joinTrigger.addEventListener('click', () => {
    // Note that you need to ensure the peer has connected to signaling server
    // before using methods of peer instance.
    if (!peer.open) {
      return;
    }

    const room = peer.joinRoom(roomId.value, {
      mode: 'sfu', //getRoomModeByHash(),
      stream: localStream,
    });
    const username = userName.value;

    room.once('open', () => {
      const sayhello = `=== ${username}\:こんにちは ===\n`;
      room.send(sayhello);
      messages.textContent += sayhello;

//      messages.textContent += `=== ${HH}\:${MM}\:${SS}_${username}：こんにちは ===\n`;
    });
//    room.on('peerJoin', peerId => {
//      messages.textContent += `=== ${peerId} joined ===\n`;
//    });

    // Render remote stream for new peer join in the room
    room.on('stream', async stream => {
      const newVideo = document.createElement('video');
      newVideo.srcObject = stream;
      newVideo.playsInline = true;
      // mark peerId to find it later at peerLeave event
      newVideo.setAttribute('data-peer-id', stream.peerId);
      remoteVideos.append(newVideo);
      await newVideo.play().catch(console.error);
    });

    room.on('data', ({ data, src }) => {
      // Show a message sent to the room and who sent
//      messages.textContent += `${src}: ${data}\n`;
      messages.textContent += `${data}\n`;
    });

    // for closing room members
    room.on('peerLeave', peerId => {
      const remoteVideo = remoteVideos.querySelector(
        `[data-peer-id=${peerId}]`
      );
      remoteVideo.srcObject.getTracks().forEach(track => track.stop());
      remoteVideo.srcObject = null;
      remoteVideo.remove();

      messages.textContent += `=== ${peerId} left ===\n`;
    });

    // for closing myself
    room.once('close', () => {
      sendTrigger.removeEventListener('click', onClickSend);
      messages.textContent += '== You left ===\n';
      Array.from(remoteVideos.children).forEach(remoteVideo => {
        remoteVideo.srcObject.getTracks().forEach(track => track.stop());
        remoteVideo.srcObject = null;
        remoteVideo.remove();
      });
    });

    sendTrigger.addEventListener('click', onClickSend);
    leaveTrigger.addEventListener('click', () => room.close(), { once: true });

    function onClickSend() {
      // Send message to all of the peers in the room via websocket
      const sendMessage = `${username}\: ${localText.value}\n`;
      room.send(sendMessage);

//      messages.textContent += `${peer.id}: ${localText.value}\n`;
      messages.textContent += sendMessage;
      localText.value = '';
    }
  });

  peer.on('error', console.error);
})();
