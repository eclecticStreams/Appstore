document.addEventListener("DOMContentLoaded", () => {
    // Firebase Configuration
    const firebaseConfig = {
        apiKey: "AIzaSyB-uRJuMdCtwOD9RB8VqxebUSXYrSm_O_k",
        authDomain: "eclectic-app-store.firebaseapp.com",
        projectId: "eclectic-app-store",
        storageBucket: "eclectic-app-store.appspot.com",
        messagingSenderId: "1035627658401",
        appId: "1:1035627658401:web:6d21758a9532804d3404e0",
        measurementId: "G-P96P39EVFF"
    };

    // Initialize Firebase
    firebase.initializeApp(firebaseConfig);
    const auth = firebase.auth();
    const db = firebase.firestore();
    const storage = firebase.storage();

    // Show sign-up form and hide login form
    document.getElementById('show-signup').addEventListener('click', () => {
        document.getElementById('login-form').style.display = 'none';
        document.getElementById('signup-form').style.display = 'block';
    });

    // Show login form and hide sign-up form
    document.getElementById('show-login').addEventListener('click', () => {
        document.getElementById('signup-form').style.display = 'none';
        document.getElementById('login-form').style.display = 'block';
    });

    // Handle login
    document.getElementById('login-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        auth.signInWithEmailAndPassword(email, password)
            .then((userCredential) => {
                document.getElementById('auth-container').style.display = 'none';
                document.getElementById('dashboard').style.display = 'block';
                loadAppList();
            })
            .catch((error) => {
                alert('Error: ' + error.message);
            });
    });

    // Handle signup
    document.getElementById('signup-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('signup-email').value;
        const password = document.getElementById('signup-password').value;
        auth.createUserWithEmailAndPassword(email, password)
            .then((userCredential) => {
                alert('Sign up successful!');
                document.getElementById('show-login').click();
            })
            .catch((error) => {
                alert('Error: ' + error.message);
            });
    });

    // Handle app submission
    document.getElementById('app-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const appName = document.getElementById('app-name').value;
        const appDescription = document.getElementById('app-description').value;
        const appCategory = document.getElementById('app-category').value;
        const appVersion = document.getElementById('app-version').value;
        const appIcon = document.getElementById('app-icon').files[0];
        const appApk = document.getElementById('app-apk').files[0];

        const appData = {
            name: appName,
            description: appDescription,
            category: appCategory,
            version: appVersion,
            iconUrl: '',
            apkUrl: ''
        };

        const uploadIconTask = storage.ref('icons/' + appIcon.name).put(appIcon);
        const uploadApkTask = storage.ref('apks/' + appApk.name).put(appApk);

        uploadIconTask.on('state_changed', null, (error) => {
            console.error('Upload failed:', error);
        }, () => {
            uploadIconTask.snapshot.ref.getDownloadURL().then((iconUrl) => {
                appData.iconUrl = iconUrl;
                uploadApkTask.on('state_changed', null, (error) => {
                    console.error('Upload failed:', error);
                }, () => {
                    uploadApkTask.snapshot.ref.getDownloadURL().then((apkUrl) => {
                        appData.apkUrl = apkUrl;
                        db.collection('apps').add(appData).then(() => {
                            alert('App submitted successfully!');
                            postToBlogger(appData); // Post to Blogger
                            loadAppList();
                        }).catch((error) => {
                            console.error('Error submitting app:', error);
                        });
                    });
                });
            });
        });
    });

    function loadAppList() {
        const appList = document.getElementById('app-items');
        appList.innerHTML = '';
        db.collection('apps').get().then((querySnapshot) => {
            querySnapshot.forEach((doc) => {
                const app = doc.data();
                const appItem = document.createElement('div');
                appItem.className = 'app-item';
                appItem.innerHTML = `
                    <h3>${app.name}</h3>
                    <p>${app.description}</p>
                    <p>Category: ${app.category}</p>
                    <p>Version: ${app.version}</p>
                    <p>Icon: <img src="${app.iconUrl}" alt="${app.name}" width="50"></p>
                    <p>APK: <a href="${app.apkUrl}" target="_blank">Download</a></p>
                    <button data-id="${doc.id}">Delete</button>
                `;
                appList.appendChild(appItem);

                // Add delete functionality
                appItem.querySelector('button').addEventListener('click', (e) => {
                    const docId = e.target.getAttribute('data-id');
                    db.collection('apps').doc(docId).delete().then(() => {
                        alert('App deleted successfully!');
                        loadAppList();
                    }).catch((error) => {
                        console.error('Error deleting app:', error);
                    });
                });
            });
        }).catch((error) => {
            console.error('Error loading apps:', error);
