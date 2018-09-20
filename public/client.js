/* global Vue */

const DEBUG = true

const IMAGES = {
  pear: 'https://cdn.glitch.com/ce24a2eb-06b1-4db8-b239-f112690a5c04%2Fspinning-pear-still.png?1534594901659',
  pearSpinning: 'https://cdn.glitch.com/ce24a2eb-06b1-4db8-b239-f112690a5c04%2Fspinning-pear.gif?1534594901542"'
}

const SOUNDS = {
  gong: 'https://cdn.glitch.com/ce24a2eb-06b1-4db8-b239-f112690a5c04%2Fgong.mp3?1534333303010',
  chiefChef: 'https://cdn.glitch.com/ce24a2eb-06b1-4db8-b239-f112690a5c04%2Fchiefchef.mp3?1537460342082'
}

const DEFAULT_MINUTES_AMOUNT = 5

function parseTimeStringPart (timeString, timeAmountString) { 
  if (timeString === '00') {
    return `${timeString}${timeAmountString} `
  }
  
  if (timeString.length === 2 && timeString[0] === '0') {
     return `${timeString[1]}${timeAmountString} `
  }
  
  return `${timeString}${timeAmountString} `
}

function formatTimeFromSeconds (seconds) {
  const date = new Date(null)
  date.setSeconds(seconds)
  const timeString = date.toISOString().substr(11, 8)
  const [hoursString, minutesString, secondsString] = timeString.split(':')
  
  let niceTimeString = ''
  
  if (hoursString !== '00') {
    niceTimeString += parseTimeStringPart(hoursString, 'h')
    niceTimeString += parseTimeStringPart(minutesString, 'm')
    niceTimeString += parseTimeStringPart(secondsString, 's')
  } else if (minutesString !== '00') {
    niceTimeString += parseTimeStringPart(minutesString, 'm')
    niceTimeString += parseTimeStringPart(secondsString, 's')
  } else if (secondsString !== '00') {
    niceTimeString += parseTimeStringPart(secondsString, 's')
  } else {
    niceTimeString += '0s'
  }
  
  return niceTimeString.trim()
}

function main() {
  const store = {
    debug: DEBUG,
    
    state: {
      soundName: 'gong',
      
      audio: null,
      canPlayAudio: false,
      audioPlaying: false, 
      audioEnabled: false,

      notificationPermission: '',
      notificationsEnabled: false,
      notificationsDurationSeconds: 1,

      timer: null,
      timerPaused: false,
      timerRunning: false,
      timerCurrentTimeSeconds: 0,
      timerEndTimeSeconds: DEFAULT_MINUTES_AMOUNT * 60,
      timerEndTimeMinutes: DEFAULT_MINUTES_AMOUNT,
      timerRemainingTimeFormatted: formatTimeFromSeconds(DEFAULT_MINUTES_AMOUNT * 60),
      timerProgressPercentage: 0,
      timerIntervalSeconds: 1,
      timerRepeatAtEndEnabled: false
    },
    
    setTitle (title) {
      if (this.debug) console.log('setTitle triggered')
      
      if (!title) {
        document.title = 'Pairing Timer'
      }
      
      document.title = `${title} | Pairing Timer`
    },
    
    triggerEndOfTimer () {
      if (this.debug) console.log('triggerEndOfTimer triggered')
      
      if (this.state.audioEnabled) {
        this.state.audio.play()
      }
      
      if (this.state.notificationsEnabled) {
        this.spawnNotification({
          title: 'Timer finished',
          body: this.state.timerRepeatAtEndEnabled ? 'Timer starting again' : 'Click to start timer again'
        })
      }
      
      if (this.state.timerRepeatAtEndEnabled) {
        this.setTimerCurrentTime(0)
      }
      
      if (!this.state.timerRepeatAtEndEnabled) {
        this.setTimerRunning(false)
      }
    },
    
    setTimeProgressPercentage () {
      if (this.debug) console.log('setTimeProgressPercentage triggered')
      
      console.log(this.state.timerCurrentTimeSeconds, this.state.timerEndTimeSeconds)
      
      const formattedTimeRemaining = formatTimeFromSeconds(
        this.state.timerEndTimeSeconds - this.state.timerCurrentTimeSeconds
      )
      this.state.timerRemainingTimeFormatted = formattedTimeRemaining
      this.setTitle(formattedTimeRemaining)
      
      const timerProgressPercentage = (this.state.timerCurrentTimeSeconds / this.state.timerEndTimeSeconds) * 100
      this.state.timerProgressPercentage = timerProgressPercentage
    },
    
    progressTimer () {
      if (this.debug) console.log('progressTimer triggered')
      
      if (this.state.timerCurrentTimeSeconds >= this.state.timerEndTimeSeconds) {
        this.triggerEndOfTimer()
        return
      }
      
      this.setTimerCurrentTime(this.state.timerCurrentTimeSeconds + this.state.timerIntervalSeconds)
    },
    
    setTimerPaused (newValue) {
      if (this.debug) console.log('setTimerPaused triggered with', newValue)
      this.state.timerPaused = newValue
    },
    
    setTimerCurrentTime (newValue) {
      if (this.debug) console.log('setTimerCurrentTime triggered with', newValue)
      
      this.state.timerCurrentTimeSeconds = newValue
      this.setTimeProgressPercentage()
    },
    
    setTimerEndTime (newValue) {
      if (this.debug) console.log('setTimerEndTime triggered with', newValue)
      
      this.state.timerEndTimeSeconds = newValue

      const timerEndTimeMinutes = newValue / 60
      if ('localStorage' in window) {
        window.localStorage.setItem('timerEndTimeMinutes', timerEndTimeMinutes)
      }
      this.state.timerEndTimeMinutes = timerEndTimeMinutes
      this.setTimeProgressPercentage()
    },
    
    setTimerIntervalSeconds (newValue) {
      if (this.debug) console.log('setTimerIntervalSeconds triggered with', newValue)
      this.state.timerIntervalSeconds = newValue
    },
    
    setTimerRunning (newValue) {
      if (this.debug) console.log('setTimerRunning triggered with', newValue)
            
      this.state.timerRunning = newValue

      if (newValue === false) {        
        clearInterval(this.state.timer)        
        this.state.timer = null
        return
      }
      
      this.progressTimer()
      this.state.timer = setInterval(() => this.progressTimer(), this.state.timerIntervalSeconds * 1000)
    },
    
    setTimerRepeatAtEndEnabled (newValue) {
      if (this.debug) console.log('setTimeRepeatAtEnd triggered with', newValue)
      
      if ('localStorage' in window) {
        window.localStorage.setItem('timerRepeatAtEndEnabled', newValue)
      }
      this.state.timerRepeatAtEndEnabled = newValue
    },
    
    setSoundName (newValue) {    
      if (this.debug) console.log('setSoundName triggered with', newValue)
        
        
      if ('localStorage' in window) {
        window.localStorage.setItem('soundName', newValue)
      }
      
      this.state.soundName = newValue
      
      this.setAudio(SOUNDS[newValue])
    },
    
    setSound (newValue) {
      if (this.debug) console.log('setSound triggered with', newValue)
      
      const newAudio = new Audio(newValue)
      newAudio.preload = true
      
      this.state.audio = newAudio
    },
    
    setCanPlayAudio (newValue) {
      if (this.debug) console.log('setCanPlayAudio triggered with', newValue)
      
      const canProbablyPlayAudio = newValue !== ''
      
      this.state.canPlayAudio = canProbablyPlayAudio
      
      if (canProbablyPlayAudio === false) {
        this.setAudioEnabled(false)
      }
      
      return canProbablyPlayAudio
    },
    
    setAudioEnabled (newValue) {
      if (this.debug) console.log('setAudioEnabled triggered with', newValue)
      
      if (this.state.audio) {
        if (newValue === false) {
          this.state.audio.pause()
          this.state.audio.currentTime = 0
        }
      }
      
      if ('localStorage' in window) {
        window.localStorage.setItem('audioEnabled', newValue)
      }
      this.state.audioEnabled = newValue
    },
    
    setNotificationsDurationSeconds (newValue) {
      if (this.debug) console.log('setNotificationsDurationSeconds triggered with', newValue)
      this.state.notificationsDurationSeconds = newValue
    },
    
    setNotificationsEnabled (newValue) {
      if (this.debug) console.log('setNotificationsEnabled triggered with', newValue)

      if ('localStorage' in window) {
        window.localStorage.setItem('notificationsEnabled', newValue)
      }
      this.state.notificationsEnabled = newValue
    },
    
    handleNotificationPermission (newValue) {
      if (this.debug) console.log('handleNotificationPermission triggered with', newValue)
      
      this.state.notificationPermission = newValue
      
      const notificationsGranted = newValue === 'granted'
      
      this.setNotificationsEnabled(notificationsGranted)
      
      return notificationsGranted
    },
    
    spawnNotification({ title, body, image, test }) {
      const { timerRepeatAtEndEnabled, notificationsDurationSeconds } = this.state
      
      const getTag = () => {
        if (test) {
          return 'pairing-timer-notification--test'
        }
        
        if (timerRepeatAtEndEnabled) {
          return 'pairing-timer-notification--repeat'
        }
        
        return 'pairing-timer-notification'
      }
      
      const getActions = () => {
        if (timerRepeatAtEndEnabled || test) {
          return []
        }
        
        return [
          { action: 'restart', title: 'Restart' },
          { action: 'stop', title: 'Stop' }
        ]        
      }
      
      const getRequireInteraction = () => {
        if (timerRepeatAtEndEnabled || test) {
          return false
        }
       
        return true
      }
      
      const getData = () => {
        return {
          test,
          timerRepeatAtEndEnabled: true,
          notificationsDurationSeconds: 1,
          url: location.href
        }
      }
      
      return new Promise((resolve, reject) => {
        const notificationOptions = {
          tag: getTag(),
          requireInteraction: getRequireInteraction(),
          body,
          badge: IMAGES.pear,
          icon: IMAGES.pear,
          image,
          actions: getActions(),
          data: getData()
        }

        navigator.serviceWorker.ready.then((registration) => {
          registration.getNotifications().then((notifications) => {
            // close exisiting notifications
            notifications.forEach((notification) => {
              notification.close()
            })
            
            // show new notification
            registration.showNotification(title, notificationOptions)
          }) 
        })
      })
    }
  }
  
  navigator.serviceWorker.register('service-worker.js')

  navigator.serviceWorker.addEventListener('message', (event) => {
    if (store.debug) console.log('Data from notificaton event', event.data)
    const { data } = event
    
    if (data.close) {
      return
    }

    if (data.dataSentToNotification.test) {
      return
    }
    
    if (data.action === 'stop') {
      return
    }
    
    store.setTimerCurrentTime(0)
    store.setTimerRunning(true)
  })

  // if visibility change api available
  if (document.hidden !== undefined) {
    document.addEventListener('visibilitychange', () => {
      if (store.debug) console.log(document.hidden ? 'Page in background' : 'Page open in tab')
      
      if (store.timerRunning) {
        store.setTimerRunning(false)
        store.setTimerIntervalSeconds(document.hidden ? 2 : 1)
        store.setTimerRunning(true)
      }
    }, false)
  }
  
  Vue.component('toggle-button', {
    props: [
      'id',
      'onClick',
      'isActive',
      'label'
    ],
    
    template: `
      <div class="toggle">
        <button
          role="switch"
          aria-labelledby="id"
          v-on:click="onClick"  
          :aria-checked="isActive"
          class="toggle__button"
          :class="{ 'toggle__button--active': isActive }"
        >
          {{ isActive ? 'On' : 'Off' }}
        </button>

        <span
          class="toggle__label"
          id="id"
        >
          {{ label }}
        </span>    
      </div>
    `
  })
  
  Vue.component('pear-loader', {
    props: [
      'isTimerRunning',
      'timerProgressPercentage'
    ],
    
    methods: {      
      loaderBarImage: function () {
        if (this.isTimerRunning) {
          return IMAGES.pearSpinning
        }
        
        return IMAGES.pear
      },
      
      loaderBarStyles: function () {
        return { height: `${this.calcuateHeightOfLoaderBar()}%` }
      },
      
      calcuateHeightOfLoaderBar: function () {
        if (!this.isTimerRunning) {
          return 0
        }
        
        return 100 - this.timerProgressPercentage
      }
    },
    
    template: `
      <div class="pear-loader">
        <img
          class="pear-loader__image"
          :src="loaderBarImage()"
          role="presentation"
        />
        <div
          class="pear-loader__bar"
          :style="loaderBarStyles()"
        >
        </div>
      </div>
    `
  })
  
  const testAudio = new Audio('')
  const canPlayAudio = store.setCanPlayAudio(testAudio.canPlayType('audio/mp3'))

  if (canPlayAudio) {
    store.setAudio(SOUNDS[store.state.soundName])
  }
  
  if ('localStorage' in window) {
    if (store.debug) console.log(window.localStorage)
    
    const audioEnabled = window.localStorage.getItem('audioEnabled')
    if (audioEnabled !== null) {
      store.setAudioEnabled(JSON.parse(audioEnabled))
    }
    
    const soundName = window.localStorage.getItem('soundName')
    if (soundName !== null) {      
      store.setSoundName(soundName)
    }
    
    const notificationsEnabled = window.localStorage.getItem('notificationsEnabled')
    if (notificationsEnabled !== null) {
      store.setNotificationsEnabled(JSON.parse(notificationsEnabled))
    }
    
    const timerRepeatAtEndEnabled = window.localStorage.getItem('timerRepeatAtEndEnabled')
    if (timerRepeatAtEndEnabled !== null) {
      store.setTimerRepeatAtEndEnabled(JSON.parse(timerRepeatAtEndEnabled))
    }
    
    const timerEndTimeMinutes = window.localStorage.getItem('timerEndTimeMinutes')
    if (timerEndTimeMinutes !== null) {
      store.setTimerEndTime(JSON.parse(timerEndTimeMinutes) * 60)
    }
  }

  const app = new Vue({
    el: '#app',
    data: {
      privateState: {},
      sharedState: store.state
    },
    methods: {
      handleToggleAudioClick: function () {
        store.setAudioEnabled(!this.sharedState.audioEnabled)
      },
      
      handleTestAudioClick: function () {
        this.sharedState.audio.play()
      },
      
      handleAudioSelectChange: function (event) {
        const newSoundName = event.target.value        
        store.setSoundName(newSoundName)
      },
      
      handleToggleNotificationsClick: function () {
        if (this.sharedState.notificationsEnabled) {
          store.setNotificationsEnabled(false)
          return
        }
        
        Notification.requestPermission().then(permission => {
          store.handleNotificationPermission(permission)
        })
      },
      
      handleTestNotificationsClick: function () {
        return store.spawnNotification({
          title: 'This is a test notification',
          test: true
        })
      },
      
      handleStartPauseTimerClick: function () {
        if (!this.sharedState.timer) {
          store.setTimerCurrentTime(0)
          store.setTimerRunning(true)
          store.setTimerPaused(false)
          return
        }
        
        store.setTimerRunning(false)
        store.setTimerPaused(!this.sharedState.timerPause)
      },
      
      handleResetTimerClick: function () {
        store.setTimerCurrentTime(0)
        store.setTimerPaused(false)
        store.setTimerRunning(false)
      },
      
      handleTimerEndTimeMinutesChange: function (e) {
        const newValue = e.target.value
        store.setTimerEndTime(newValue * 60)
      },
      
      handleTimerRepeatAtEndEnabledClick: function (e) {
        store.setTimerRepeatAtEndEnabled(!this.sharedState.timerRepeatAtEndEnabled)
      },
      
      handleClearDataClick: function () {
        if ('localStorage' in window) {
          window.localStorage.clear()
        }
        window.location = window.location
      }
    }
  })
}

// redirect to https if http
if (location.protocol === 'http:') {
  window.location = `https://${location.host}`
}

document.addEventListener('DOMContentLoaded', main)
