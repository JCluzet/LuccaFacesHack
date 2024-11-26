;(() => {
  const STORAGE_KEY = 'lucca_faces_data_v1'
  let people = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}
  let currentImageHash = ''
  let retryAttempts = 0
  let discoveredNew = 0
  const MAX_RETRY_ATTEMPTS = 5
  let questionsAnswered = 0
  let currentTotalScore = 0
  let accumulatedDifference = 0
  let scriptRestart = 0
  let timePerQuestion = 0 

  function approxValue(x) {
    const xData = [1000000, 1670, 1550, 1500, 1360, 1205, 1135, 1075, 1025, 975, 940, 900, 870, 835, 805, 640, 555, 500, 450, 400, 350, 300, 250, 200, 150, 100, 50, 0]
    const yData = [0, 0, 40, 60, 200, 400, 500, 600, 700, 800, 900, 1000, 1100, 1200, 1300, 2000, 2500, 3000, 3500, 4000, 4500, 5000, 5500, 6000, 6500, 7000, 7500, 8000]

    if (x >= xData[0]) return yData[0]
    if (x <= xData[xData.length - 1]) return yData[yData.length - 1]

    for (let i = 1; i < xData.length; i++) {
      if (x <= xData[i - 1] && x >= xData[i]) {
        const x0 = xData[i]
        const x1 = xData[i - 1]
        const y0 = yData[i]
        const y1 = yData[i - 1]
        return y0 + ((y1 - y0) * (x - x0)) / (x1 - x0)
      }
    }
    return null
  }

  let scorecible = parseInt(prompt('Please enter your goal score:'), 10)
  if (scorecible > 1550) {
    alert('⚠️ WARNING ⚠️ A score above 1550 is not recommended. Lucca may ban people who score too high.')
    const confirmation = confirm('You could be banned for 1 month from lucca face if you score too high. Are you sure you want to continue?')
    if (!confirmation) {
      console.log('User canceled the operation.')
      return
    }
  }

  timePerQuestion = approxValue(scorecible)
  if (timePerQuestion === null) {
    console.error('Score cible invalide. Veuillez entrer un score cible entre 555 et 1670.')
    return
  }

  function getTotalPointsFromHeaderText(headerText) {
    const regex = /(\d+) pts/
    const match = headerText.match(regex)
    return match && match.length > 1 ? parseInt(match[1], 10) : 0
  }

  function getPointsFromSpanText(spanText) {
    const regex = /\+ (\d+) pts/
    const match = spanText.match(regex)
    return match && match.length > 1 ? parseInt(match[1], 10) : 0
  }

  function getImageHash(imageSrc) {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = 'Anonymous'
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        canvas.width = img.width
        canvas.height = img.height
        ctx.drawImage(img, 0, 0)
        canvas.toBlob((blob) => {
          const reader = new FileReader()
          reader.onloadend = () => {
            crypto.subtle.digest('SHA-256', reader.result).then((hashBuffer) => {
              const hashArray = Array.from(new Uint8Array(hashBuffer))
              const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
              resolve(hashHex)
            })
          }
          reader.onerror = reject
          reader.readAsArrayBuffer(blob)
        })
      }
      img.onerror = reject
      img.src = imageSrc
    })
  }

  function gameCompleted() {
    console.log('')
    if (discoveredNew === 0) {
      if (accumulatedDifference === 0) {
        console.log(`Game completed. Total score achieved: ${currentTotalScore}, perfect score! 🚀`)
      } else {
        console.log(`Game completed. Total score achieved: ${currentTotalScore}, with a difference of ${accumulatedDifference}pts.`)
      }
    } else {
      console.log(`During this party you have discovered ${discoveredNew} new people!`)
      console.log(`Until there is new person to discover, you can't reach the score of ${scorecible}pts`)
      console.log(`Start a new game to reach the score of ${scorecible}pts ...`)
      restartGame()
    }
    console.log('')
  }

  function handleNewImage(imageSrc) {
    getImageHash(imageSrc)
      .then((hashHex) => {
        if (hashHex !== currentImageHash) {
          currentImageHash = hashHex
          if (people[currentImageHash]) {
            ensureChoicesLoaded()
              .then((choices) => {
                const correctAnswer = [...choices].find((choice) => choice.textContent.trim() === people[currentImageHash].trim())
                if (correctAnswer) {
                  console.log(`Found known person: ${people[currentImageHash]}, clicking after ${timePerQuestion}ms...`)
                  setTimeout(() => {
                    correctAnswer.click()
                    pollForScoreElement((pointsEarned) => {
                      questionsAnswered++
                      currentTotalScore += pointsEarned

                      const questionsRemaining = 10 - questionsAnswered
                      accumulatedDifference = scorecible - currentTotalScore
                      const scoreNeededForNextQuestion = questionsRemaining > 0 ? Math.ceil(accumulatedDifference / questionsRemaining) : 0
                      const scoreForApproxValue = scoreNeededForNextQuestion * 10
                      const newDelay = approxValue(scoreForApproxValue)

                      console.log(`${questionsAnswered}/10: ${people[currentImageHash]}, for ${pointsEarned}pts. Total: ${currentTotalScore}`)
                      if (timePerQuestion !== newDelay && questionsAnswered < 10 && discoveredNew === 0) {
                        console.log('   --> ADAPTING! Requested points for next question:', scoreNeededForNextQuestion)
                        console.log(`   --> Delay for next question is now: ${newDelay.toFixed(1)}ms`)
                        timePerQuestion = newDelay
                      }

                      if (questionsAnswered < 10) {
                        setTimeout(() => {
                          const newImageElement = document.querySelector('#game app-timer .image')
                          if (newImageElement) {
                            const newImageSrc = newImageElement.style.backgroundImage.match(/url\("(.*)"\)/)[1]
                            handleNewImage(newImageSrc)
                          }
                        }, newDelay)
                      } else {
                        gameCompleted()
                      }
                    })
                  }, timePerQuestion)
                } else {
                  console.error('Correct answer element not found.')
                  chooseRandomAnswer()
                }
              })
              .catch(() => {
                console.error('No choices available to click.')
              })
          } else {
            discoveredNew++
            chooseRandomAnswer()
          }
        }
        retryAttempts = 0
      })
      .catch((error) => {
        if (questionsAnswered < 10) {
          console.error('Error processing image:', error)
          retryAttempts++
          if (retryAttempts <= MAX_RETRY_ATTEMPTS) {
            console.log(`Retrying (${retryAttempts}/${MAX_RETRY_ATTEMPTS})...`)
            setTimeout(() => handleNewImage(imageSrc), 100)
          } else {
            console.log('Max retry attempts reached. Skipping image.')
            retryAttempts = 0
          }
        }
      })
  }

  function pollForScoreElement(callback) {
    const interval = setInterval(() => {
      const imageOverlayElement = document.querySelector('.image-container .image-overlay span.score')
      if (imageOverlayElement) {
        clearInterval(interval)
        const pointsEarned = getPointsFromSpanText(imageOverlayElement.textContent)
        callback(pointsEarned)
      }
    }, 100)
  }

  function chooseRandomAnswer() {
    ensureChoicesLoaded()
      .then((choices) => {
        const randomChoice = choices[Math.floor(Math.random() * choices.length)]
        const randomTime = Math.floor(Math.random() * 1000) + 500
        setTimeout(() => randomChoice.click(), randomTime)
        setTimeout(() => {
          const correctAnswer = document.querySelector('#game .answers .is-right')
          if (correctAnswer) {
            const name = correctAnswer.textContent.trim()
            people[currentImageHash] = name
            localStorage.setItem(STORAGE_KEY, JSON.stringify(people))
            questionsAnswered++
            console.log(` NEW PERSON --> Discovered ${name} for hash ${currentImageHash}`)
          } else {
            console.error('Failed to discover the correct answer!')
          }
          if (questionsAnswered === 10) gameCompleted()
        }, 500 + randomTime)
      })
      .catch(() => {
        console.error('No choices available to click.')
      })
  }

  function ensureChoicesLoaded(retries = 5, delay = 100) {
    return new Promise((resolve, reject) => {
      const checkChoices = (attemptsLeft) => {
        const choices = document.querySelectorAll('#game .answers .answer')
        if (choices.length > 0) {
          resolve(choices)
        } else if (attemptsLeft > 0) {
          setTimeout(() => checkChoices(attemptsLeft - 1), delay)
        } else {
          reject('Choices did not load in time')
        }
      }
      checkChoices(retries)
    })
  }

  function startGame() {
    const goButton = document.querySelector('button.rotation-loader')
    if (goButton) {
      console.log('Starting game...')
      // On configure d'abord un observateur pour le document entier
      const documentObserver = new MutationObserver(() => {
        const gameElement = document.querySelector('#game')
        if (gameElement) {
          console.log('Game element detected, setting up game observer...')
          documentObserver.disconnect()
          setupGameObserver()
        }
      })
      
      // Observer le document pour détecter quand le jeu apparaît
      documentObserver.observe(document.body, { childList: true, subtree: true })
      
      // Cliquer sur Go
      goButton.click()
    }
  }

  function restartGame() {
    const replayButton = document.querySelector('button.button.palette-primary.palette-none.is-default')
    if (replayButton && replayButton.textContent.trim() === 'Rejouer') {
      console.log('Restarting game...')
      replayButton.click()
      
      setTimeout(() => {
        const goButton = document.querySelector('button.rotation-loader')
        if (goButton) {
          // Réinitialiser les variables pour la nouvelle partie
          questionsAnswered = 0
          currentTotalScore = 0
          accumulatedDifference = 0
          discoveredNew = 0
          currentImageHash = ''
          
          // Même approche que startGame
          const documentObserver = new MutationObserver(() => {
            const gameElement = document.querySelector('#game')
            if (gameElement) {
              console.log('Game element detected after restart, setting up game observer...')
              documentObserver.disconnect()
              setupGameObserver()
            }
          })
          
          documentObserver.observe(document.body, { childList: true, subtree: true })
          
          console.log('Clicking Go for new game...')
          goButton.click()
        }
      }, 2000)
    }
  }

  let gameObserver = null

  function setupGameObserver() {
    // Déconnecter l'ancien observateur s'il existe
    if (gameObserver) {
      gameObserver.disconnect()
      gameObserver = null
    }

    const gameElement = document.querySelector('#game')
    if (!gameElement) {
      console.error('Game element not found in setupGameObserver!')
      return
    }
    
    console.log('Setting up game observer...')
    gameObserver = new MutationObserver(() => {
      const imageElement = document.querySelector('#game app-timer .image')
      if (imageElement) {
        const imageSrc = imageElement.style.backgroundImage.match(/url\("(.*)"\)/)[1]
        if (imageSrc) {
          console.log('New image detected, handling...')
          handleNewImage(imageSrc)
        }
      }
    })
    
    gameObserver.observe(gameElement, { childList: true, subtree: true })
    console.log('Game observer setup complete')
    
    // Vérifier immédiatement s'il y a déjà une image
    const imageElement = document.querySelector('#game app-timer .image')
    if (imageElement) {
      const imageSrc = imageElement.style.backgroundImage.match(/url\("(.*)"\)/)[1]
      if (imageSrc) {
        console.log('Initial image found, handling...')
        handleNewImage(imageSrc)
      }
    }
  }

  function main() {
    const goButton = document.querySelector('button.rotation-loader')
    if (!goButton) {
      alert("Vous devez commencer à mettre ce script quand vous êtes sur la page 'Go à toi de jouer' de Lucca Faces")
      return
    }

    console.log(`Initial calculated delay: ${timePerQuestion.toFixed(1)}ms for ~${(scorecible / 10).toFixed(0)}pts per question`)
    startGame()
    setInterval(restartGame, 1000)
  }

  main()
})()
