const Peer = window.Peer;

(async function main() {
  const localVideo = document.getElementById('js-local-stream');
  const joinTrigger = document.getElementById('js-join-trigger');
  const leaveTrigger = document.getElementById('js-leave-trigger');
      leaveTrigger.style.display = 'none';
  const remoteVideos = document.getElementById('js-remote-streams');
  const roomId = document.getElementById('js-room-id');
  const roomMode = document.getElementById('js-room-mode');
  const userName = document.getElementById('js-user-name');
  const userNameBtn = document.getElementsByName('js-user-name-btn');
  const namingForms = document.getElementById('js-naming-forms');
  const localText = document.getElementById('js-local-text');
  const sendTrigger = document.getElementById('js-send-trigger');
  const sendMessages = document.getElementById('js-send-messages');
      sendMessages.style.display = 'none';
  const messages = document.getElementById('js-messages');
  const meta = document.getElementById('js-meta');
  const sdkSrc = document.querySelector('script[src*=skyway]');
  const mmute = document.getElementById('js-switch-mmute');
  const vmute = document.getElementById('js-switch-vmute');
  const mdevice = document.getElementById('js-switch-mdevice');
  const vdevice = document.getElementById('js-switch-vdevice');
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
	
	//ミュートにしたい！ができてない！！
  mmute.addEventListener('click', () => {
	  localStream.getAudioTracks().forEach(track => track.enable = false);
	console.log('mmute');
  });
	//デバイスの切り替えをしたいがわからん！！
  vdevice.addEventListener('click', () => {
	  const devices = navigator.mediaDevices.enumerateDevices(); 

	  const newVideoInputDevice = devices.find(
		  device => device.kind === 'videoinput'
	  );
	  const newVideoStream = navigator.mediaDevices.getUserMedia({
		  video: {
			  deviceId: newVideoInputDevice.deviceId,
		  },
	  });
	console.log('vdevice');
  });

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

	  
    // user object [0] is myself
    const user = {
	    peerId: [peer.id],
	    name: [userName.value],
	    media: [localVideo],
	    addUser(peerId,name,media){
		    this.peerId.push(peerId);
		    this.name.push(name);
		    this.media.push(media);
	    }
    }

    // messageArray for text chat.
    const messageArray = {
	    value: [],
	    history: [],
	    pushMessage(message,sender) {
		this.value.push(HH+":"+MM+" "+sender+":"+message);
	    	this.history.push(this.value.shift());    
		return this.value.join('\n');
	    }
    };
    messageArray.value.length = 5;

    const dataChannel = peer.connect(peer.id, {metadata: user});
	  console.log(dataChannel);

    room.once('open', () => {
      // Changing Objects Display.
      namingForms.style.display = 'none';
      joinTrigger.style.display = 'none';
      leaveTrigger.style.display = 'inline';
      sendMessages.style.display = 'block';

      // Sending My Name.
      const sayhello = `こんにちは`;
      //const sendname = `#name:${I.name}`;
      room.send(sayhello);
      //room.send(sendname);
      
      messages.textContent = messageArray.pushMessage(sayhello, user.name[0]);

    });

    room.on('peerJoin', peerId => {
	const newMessage = `=== こんにちは ===`;
        messages.textContent = messageArray.pushMessage(newMessage, peerId);
    });

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
//      if(${data}.indexOf('#name') === 0;){
//	const user = new user(src, data.substr(7), 98);
//      }
//      messages.textContent += `${data}\n`;
        messages.textContent = messageArray.pushMessage(data, src);
    });

    // for closing room members
    room.on('peerLeave', peerId => {
      const remoteVideo = remoteVideos.querySelector(
        `[data-peer-id=${peerId}]`
      );
      remoteVideo.srcObject.getTracks().forEach(track => track.stop());
      remoteVideo.srcObject = null;
      remoteVideo.remove();

	const newMessage = `=== バイバーイ ===`;
        messages.textContent = messageArray.pushMessage(newMessage, peerId);
    });

    // for closing myself
    room.once('close', () => {
      namingForms.style.display = 'block';
      joinTrigger.style.display = 'inline';
      leaveTrigger.style.display = 'none';
      sendMessages.style.display = 'none';
      sendTrigger.removeEventListener('click', onClickSend);

	const newMessage = `=== バイバーイ ===`;
        messages.textContent = messageArray.pushMessage(newMessage, user.name[0]);

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
      const sendMessage = localText.value;
      room.send(sendMessage);

//      messages.textContent += `${peer.id}: ${localText.value}\n`;
      messages.textContent = messageArray.pushMessage(sendMessage, user.name[0]);
      console.log(messageArray.value.join('/'));
      console.log(messageArray.history.join('/'));
      localText.value = '';
    }
  });

  peer.on('error', console.error);
})();
