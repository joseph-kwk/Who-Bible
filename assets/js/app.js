// Bible People Challenge — structured app.js

// =========================
// Default dataset
// =========================
const DEFAULT_PEOPLE_DATA = [
  {'name':'Noah','aliases':[],'mother':null,'father':'Lamech','spouse':null,'children':['Shem','Ham','Japheth'],'siblings':[],'occupation':'Righteous man, built the ark','age_notes':'Lived 950 years','notable_events':['Built the ark','Survived the flood','Sent out dove and raven'],'verses':['Genesis 6-9','Genesis 9:29'],'short_bio':'Noah built the ark to survive the flood.','testament':'ot','gender':'male'},
  {'name':'Moses','aliases':[],'mother':'Jochebed','father':'Amram','spouse':'Zipporah','children':['Gershom','Eliezer'],'siblings':['Aaron','Miriam'],'occupation':'Leader, prophet','age_notes':'Died at 120; 80 when confronting Pharaoh','notable_events':['Led Exodus','Saw burning bush','Parted Red Sea','Received Ten Commandments'],'verses':['Exodus 3','Exodus 14','Exodus 20','Deuteronomy 34:7'],'short_bio':'Moses led the Israelites out of Egypt.','testament':'ot','gender':'male'},
  {'name':'Solomon','aliases':[],'mother':'Bathsheba','father':'David','spouse':null,'children':['Rehoboam'],'siblings':['Absalom'],'occupation':'King','age_notes':'Reigned 40 years','notable_events':['Built the temple','Known for wisdom','Judged between two mothers'],'verses':['1 Kings 3','1 Kings 6','2 Samuel 12:24'],'short_bio':'Son of David and Bathsheba; famed for wisdom.','testament':'ot','gender':'male'},
  {'name':'Joseph (son of Jacob)','aliases':['Joseph of Egypt'],'mother':'Rachel','father':'Jacob','spouse':'Asenath','children':['Manasseh','Ephraim'],'siblings':['Reuben','Simeon','Levi','Judah','Benjamin'],'occupation':'Official in Egypt','age_notes':'Sold by brothers at 17; died at 110','notable_events':['Sold into Egypt','Interpreted dreams','Saved Egypt from famine','Reunited with family'],'verses':['Genesis 37:2','Genesis 41','Genesis 45','Genesis 50:26'],'short_bio':'Joseph was sold into Egypt and rose to power.','testament':'ot','gender':'male'},
  {'name':'David','aliases':[],'mother':null,'father':'Jesse','spouse':['Michal','Bathsheba'],'children':['Solomon','Absalom'],'siblings':[],'occupation':'Shepherd, King','age_notes':'Became king at 30; reigned 40 years','notable_events':['Killed Goliath','Became king','Danced before the ark','Committed adultery with Bathsheba'],'verses':['1 Samuel 17','2 Samuel 5:4','2 Samuel 6','2 Samuel 11'],'short_bio':'Shepherd who became king of Israel; famous for defeating Goliath.','testament':'ot','gender':'male'},
  {'name':'Esther','aliases':['Hadassah'],'mother':null,'father':null,'spouse':'Xerxes','children':[],'siblings':[],'occupation':'Queen','age_notes':null,'notable_events':['Became queen and saved her people','Revealed Haman's plot'],'verses':['Esther 2','Esther 7'],'short_bio':'Jewish queen of Persia who saved her people.','testament':'ot','gender':'female'},
  {'name':'Mary (mother of Jesus)','aliases':[],'mother':null,'father':null,'spouse':'Joseph','children':['Jesus'],'siblings':[],'occupation':null,'age_notes':null,'notable_events':['Mother of Jesus','Visited by angel Gabriel','Present at crucifixion'],'verses':['Luke 1:26-38','John 19:25'],'short_bio':'Mother of Jesus.','testament':'nt','gender':'female'},
  {'name':'John the Baptist','aliases':[],'mother':'Elizabeth','father':'Zechariah','spouse':null,'children':[],'siblings':[],'occupation':'Prophet','age_notes':null,'notable_events':['Baptized Jesus','Beheaded by Herod','Wore camel hair'],'verses':['Luke 1','Matthew 3','Matthew 14'],'short_bio':'Prophet who baptized Jesus.','testament':'nt','gender':'male'},
  {'name':'Paul','aliases':['Saul'],'mother':null,'father':null,'spouse':null,'children':[],'siblings':[],'occupation':'Apostle, tent maker','age_notes':null,'notable_events':['Converted on road to Damascus','Missionary journeys','Wrote epistles','Shipwrecked'],'verses':['Acts 9','Acts 13-28','2 Corinthians 11:25'],'short_bio':'Originally named Saul; became Apostle Paul after conversion.','testament':'nt','gender':'male'},
  {'name':'Peter','aliases':['Simon Peter','Simon'],'mother':null,'father':'John','spouse':null,'children':[],'siblings':['Andrew'],'occupation':'Fisherman, Apostle','age_notes':null,'notable_events':['Walked on water','Denial of Jesus','Leader of early church','Vision of unclean animals'],'verses':['Matthew 14:29','Matthew 26:69-75','Acts 10'],'short_bio':'One of Jesus's closest disciples; called Peter.','testament':'nt','gender':'male'},
  {'name':'Lazarus','aliases':[],'mother':null,'father':null,'spouse':null,'children':[],'siblings':['Martha','Mary (sister of Lazarus)'],'occupation':null,'age_notes':null,'notable_events':['Raised from the dead by Jesus','Brother of Mary and Martha'],'verses':['John 11','John 12'],'short_bio':'Brother of Mary and Martha; raised from the dead.','testament':'nt','gender':'male'},
  {'name':'Abraham','aliases':['Abram'],'mother':null,'father':'Terah','spouse':'Sarah','children':['Isaac','Ishmael'],'siblings':[],'occupation':'Patriarch','age_notes':'Died at 175; fathered Isaac at 100','notable_events':['Father of Isaac','Covenant with God','Nearly sacrificed Isaac','Left Ur'],'verses':['Genesis 12','Genesis 17','Genesis 22','Genesis 25:7'],'short_bio':'Father of the Israelite nation.','testament':'ot','gender':'male'},
  {'name':'Isaac','aliases':[],'mother':'Sarah','father':'Abraham','spouse':'Rebekah','children':['Jacob','Esau'],'siblings':['Ishmael'],'occupation':'Patriarch','age_notes':'Died at 180; born when Abraham was 100','notable_events':['Son of Abraham and Sarah','Nearly sacrificed by Abraham','Married Rebekah'],'verses':['Genesis 22','Genesis 24','Genesis 35:28'],'short_bio':'Son of Abraham and Sarah; father of Jacob.','testament':'ot','gender':'male'},
  {'name':'Jacob','aliases':['Israel'],'mother':'Rebekah','father':'Isaac','spouse':['Leah','Rachel'],'children':['Reuben','Simeon','Levi','Judah','Joseph (son of Jacob)','Benjamin'],'siblings':['Esau'],'occupation':'Patriarch','age_notes':'Died at 147','notable_events':['Renamed Israel','Father of the 12 tribes','Wrestled with angel','Deceived Isaac'],'verses':['Genesis 27','Genesis 32:28','Genesis 47:28'],'short_bio':'Father of the 12 tribes of Israel.','testament':'ot','gender':'male'},
  {'name':'Samuel','aliases':[],'mother':'Hannah','father':'Elkanah','spouse':null,'children':[],'siblings':[],'occupation':'Prophet, Judge','age_notes':'Dedicated to temple as child','notable_events':['Anointed Saul and David','Heard God's voice as child','Judge of Israel'],'verses':['1 Samuel 3','1 Samuel 10','1 Samuel 16'],'short_bio':'Prophet and judge who anointed Israel's first kings.','testament':'ot','gender':'male'},
  {'name':'Elijah','aliases':[],'mother':null,'father':null,'spouse':null,'children':[],'siblings':[],'occupation':'Prophet','age_notes':null,'notable_events':['Taken up by chariot of fire','Defeated prophets of Baal','Fed by ravens','Raised widow's son'],'verses':['1 Kings 17','1 Kings 18','2 Kings 2'],'short_bio':'Great prophet who was taken to heaven in a chariot.','testament':'ot','gender':'male'},
  {'name':'Jonah','aliases':[],'mother':null,'father':'Amittai','spouse':null,'children':[],'siblings':[],'occupation':'Prophet','age_notes':null,'notable_events':['Swallowed by fish','Preached to Nineveh','Fled from God'],'verses':['Jonah 1-4'],'short_bio':'Prophet who fled God and was swallowed by a great fish.','testament':'ot','gender':'male'},
  {'name':'Ruth','aliases':[],'mother':null,'father':null,'spouse':'Boaz','children':['Obed'],'siblings':[],'occupation':'Gleaner','age_notes':null,'notable_events':['Ancestor of David','Married Boaz','Loyal to Naomi'],'verses':['Ruth 1-4'],'short_bio':'Moabite woman who became ancestor to King David.','testament':'ot','gender':'female'},
  {'name':'Mary Magdalene','aliases':[],'mother':null,'father':null,'spouse':null,'children':[],'siblings':[],'occupation':null,'age_notes':null,'notable_events':['Witnessed resurrection','Seven demons cast out','Followed Jesus'],'verses':['Luke 8:2','Matthew 28','John 20'],'short_bio':'Witness of Jesus's resurrection.','testament':'nt','gender':'female'},
  {'name':'Saul (first king)','aliases':[],'mother':null,'father':'Kish','spouse':'Ahinoam','children':['Jonathan'],'siblings':[],'occupation':'King','age_notes':'Reigned 40 years','notable_events':['First king of Israel','Consulted witch of Endor','Fell on sword'],'verses':['1 Samuel 9-10','1 Samuel 28','1 Samuel 31'],'short_bio':'Israel's first king anointed by Samuel.','testament':'ot','gender':'male'},
  {'name':'Daniel','aliases':[],'mother':null,'father':null,'spouse':null,'children':[],'siblings':[],'occupation':'Prophet, official','age_notes':'Taken to Babylon as youth','notable_events':['In the lion's den','Interpreted dreams','Three friends in furnace'],'verses':['Daniel 1','Daniel 3','Daniel 6'],'short_bio':'Prophet in Babylon; survived lion's den.','testament':'ot','gender':'male'},
  {'name':'Joshua','aliases':[],'mother':null,'father':'Nun','spouse':null,'children':[],'siblings':[],'occupation':'Military leader','age_notes':'Died at 110','notable_events':['Led conquest of Canaan','Walls of Jericho fell','Stopped sun and moon'],'verses':['Joshua 1','Joshua 6','Joshua 10:12-13','Joshua 24:29'],'short_bio':'Successor to Moses who led Israel into Promised Land.','testament':'ot','gender':'male'},
  {'name':'Deborah','aliases':[],'mother':null,'father':null,'spouse':'Lappidoth','children':[],'siblings':[],'occupation':'Prophet, Judge','age_notes':null,'notable_events':['Judge of Israel','Led victory over Canaanites','Sang victory song'],'verses':['Judges 4-5'],'short_bio':'Prophet and judge who led Israel to victory.','testament':'ot','gender':'female'},
  {'name':'Gideon','aliases':[],'mother':null,'father':'Joash','spouse':null,'children':[],'siblings':[],'occupation':'Judge','age_notes':null,'notable_events':['Defeated Midianites with 300 men','Asked for fleece sign','Tore down Baal altar'],'verses':['Judges 6-7'],'short_bio':'Judge who defeated the Midianites with 300 men.','testament':'ot','gender':'male'},
  {'name':'Samson','aliases':[],'mother':null,'father':'Manoah','spouse':null,'children':[],'siblings':[],'occupation':'Judge','age_notes':'Nazirite from birth','notable_events':['Super strength from long hair','Betrayed by Delilah','Killed Philistines'],'verses':['Judges 13-16'],'short_bio':'Judge with supernatural strength; betrayed by Delilah.','testament':'ot','gender':'male'},
  {'name':'Jeremiah','aliases':[],'mother':null,'father':'Hilkiah','spouse':null,'children':[],'siblings':[],'occupation':'Prophet','age_notes':'Called as youth','notable_events':['Wept for Jerusalem','Put in cistern','Prophesied exile'],'verses':['Jeremiah 1','Jeremiah 38','Jeremiah 52'],'short_bio':'Weeping prophet who warned of Babylon's destruction.','testament':'ot','gender':'male'},
  {'name':'Ezekiel','aliases':[],'mother':null,'father':'Buzi','spouse':null,'children':[],'siblings':[],'occupation':'Prophet, priest','age_notes':'Exiled to Babylon','notable_events':['Vision of dry bones','Vision of wheels','Temple vision'],'verses':['Ezekiel 1','Ezekiel 37','Ezekiel 40-48'],'short_bio':'Prophet of the exile with dramatic visions.','testament':'ot','gender':'male'},
  {'name':'Isaiah','aliases':[],'mother':null,'father':'Amoz','spouse':null,'children':[],'siblings':[],'occupation':'Prophet','age_notes':null,'notable_events':['Vision of God's throne','Prophesied Messiah','Walked naked three years'],'verses':['Isaiah 6','Isaiah 53','Isaiah 20'],'short_bio':'Major prophet who prophesied about the Messiah.','testament':'ot','gender':'male'},
  {'name':'Job','aliases':[],'mother':null,'father':null,'spouse':null,'children':[],'siblings':[],'occupation':'Wealthy landowner','age_notes':'Lived 140 years after trials','notable_events':['Tested by Satan','Lost everything','Remained faithful','Restored double'],'verses':['Job 1-2','Job 42'],'short_bio':'Righteous man who suffered but remained faithful.','testament':'ot','gender':'male'},
  {'name':'Nehemiah','aliases':[],'mother':null,'father':'Hacaliah','spouse':null,'children':[],'siblings':[],'occupation':'Cupbearer, governor','age_notes':null,'notable_events':['Rebuilt Jerusalem walls','Cupbearer to king','Led reforms'],'verses':['Nehemiah 1-2','Nehemiah 6'],'short_bio':'Led rebuilding of Jerusalem's walls.','testament':'ot','gender':'male'},
  {'name':'Ezra','aliases':[],'mother':null,'father':'Seraiah','spouse':null,'children':[],'siblings':[],'occupation':'Priest, scribe','age_notes':null,'notable_events':['Led return from exile','Read law to people','Reformed worship'],'verses':['Ezra 7','Nehemiah 8'],'short_bio':'Priest and scribe who restored the Law.','testament':'ot','gender':'male'},
  {'name':'Adam','aliases':[],'mother':null,'father':null,'spouse':'Eve','children':['Cain','Abel','Seth'],'siblings':[],'occupation':'First man','age_notes':'Lived 930 years','notable_events':['First human created','Ate forbidden fruit','Named the animals'],'verses':['Genesis 1-3','Genesis 5:5'],'short_bio':'First human created by God.','testament':'ot','gender':'male'},
  {'name':'Eve','aliases':[],'mother':null,'father':null,'spouse':'Adam','children':['Cain','Abel','Seth'],'siblings':[],'occupation':'First woman','age_notes':null,'notable_events':['First woman created','Ate forbidden fruit','Mother of all living'],'verses':['Genesis 2-3'],'short_bio':'First woman; mother of all humanity.','testament':'ot','gender':'female'},
  {'name':'Cain','aliases':[],'mother':'Eve','father':'Adam','spouse':null,'children':[],'siblings':['Abel','Seth'],'occupation':'Farmer','age_notes':null,'notable_events':['Killed Abel','First murderer','Mark of Cain'],'verses':['Genesis 4'],'short_bio':'First son of Adam and Eve; killed his brother.','testament':'ot','gender':'male'},
  {'name':'Abel','aliases':[],'mother':'Eve','father':'Adam','spouse':null,'children':[],'siblings':['Cain','Seth'],'occupation':'Shepherd','age_notes':null,'notable_events':['Killed by Cain','Offered acceptable sacrifice'],'verses':['Genesis 4','Hebrews 11:4'],'short_bio':'Second son of Adam and Eve; murdered by Cain.','testament':'ot','gender':'male'},
  {'name':'Lot','aliases':[],'mother':null,'father':'Haran','spouse':null,'children':[],'siblings':[],'occupation':null,'age_notes':null,'notable_events':['Escaped Sodom','Wife turned to salt','Saved by Abraham'],'verses':['Genesis 13','Genesis 19'],'short_bio':'Abraham's nephew who escaped Sodom's destruction.','testament':'ot','gender':'male'},
  {'name':'Sarah','aliases':['Sarai'],'mother':null,'father':'Terah','spouse':'Abraham','children':['Isaac'],'siblings':[],'occupation':null,'age_notes':'Died at 127; gave birth at 90','notable_events':['Wife of Abraham','Mother of Isaac','Laughed at promise'],'verses':['Genesis 17','Genesis 18','Genesis 23:1'],'short_bio':'Wife of Abraham and mother of Isaac.','testament':'ot','gender':'female'},
  {'name':'Rebekah','aliases':[],'mother':null,'father':'Bethuel','spouse':'Isaac','children':['Jacob','Esau'],'siblings':[],'occupation':null,'age_notes':null,'notable_events':['Wife of Isaac','Mother of Jacob and Esau','Helped Jacob deceive Isaac'],'verses':['Genesis 24','Genesis 27'],'short_bio':'Wife of Isaac; mother of Jacob and Esau.','testament':'ot','gender':'female'},
  {'name':'Rachel','aliases':[],'mother':null,'father':'Laban','spouse':'Jacob','children':['Joseph (son of Jacob)','Benjamin'],'siblings':['Leah'],'occupation':'Shepherdess','age_notes':'Died giving birth to Benjamin','notable_events':['Jacob worked 14 years for her','Mother of Joseph and Benjamin'],'verses':['Genesis 29','Genesis 35:16-19'],'short_bio':'Beloved wife of Jacob; mother of Joseph.','testament':'ot','gender':'female'},
  {'name':'Leah','aliases':[],'mother':null,'father':'Laban','spouse':'Jacob','children':['Reuben','Simeon','Levi','Judah'],'siblings':['Rachel'],'occupation':null,'age_notes':null,'notable_events':['First wife of Jacob','Mother of six sons','Weak eyes'],'verses':['Genesis 29-30'],'short_bio':'First wife of Jacob; mother of six of his sons.','testament':'ot','gender':'female'},
  {'name':'Miriam','aliases':[],'mother':'Jochebed','father':'Amram','spouse':null,'children':[],'siblings':['Moses','Aaron'],'occupation':'Prophet','age_notes':null,'notable_events':['Watched baby Moses','Led women in song','Struck with leprosy'],'verses':['Exodus 2','Exodus 15','Numbers 12'],'short_bio':'Sister of Moses and Aaron; prophetess.','testament':'ot','gender':'female'},
  {'name':'Aaron','aliases':[],'mother':'Jochebed','father':'Amram','spouse':'Elisheba','children':[],'siblings':['Moses','Miriam'],'occupation':'High priest','age_notes':'Died at 123','notable_events':['First high priest','Made golden calf','Rod that budded'],'verses':['Exodus 28','Exodus 32','Numbers 17','Numbers 33:39'],'short_bio':'Brother of Moses; first high priest of Israel.','testament':'ot','gender':'male'},
  {'name':'Caleb','aliases':[],'mother':null,'father':'Jephunneh','spouse':null,'children':[],'siblings':[],'occupation':'Spy, warrior','age_notes':'Still strong at 85','notable_events':['One of faithful spies','Conquered Hebron'],'verses':['Numbers 13-14','Joshua 14'],'short_bio':'Faithful spy who trusted God's promise.','testament':'ot','gender':'male'},
  {'name':'Elisha','aliases':[],'mother':null,'father':'Shaphat','spouse':null,'children':[],'siblings':[],'occupation':'Prophet','age_notes':null,'notable_events':['Succeeded Elijah','Parted Jordan','Multiplied oil','Raised dead boy'],'verses':['1 Kings 19','2 Kings 2','2 Kings 4'],'short_bio':'Prophet who succeeded Elijah; performed many miracles.','testament':'ot','gender':'male'},
  {'name':'Naomi','aliases':[],'mother':null,'father':null,'spouse':'Elimelech','children':[],'siblings':[],'occupation':null,'age_notes':null,'notable_events':['Mother-in-law of Ruth','Lost husband and sons','Returned to Bethlehem'],'verses':['Ruth 1-4'],'short_bio':'Mother-in-law of Ruth; returned from Moab.','testament':'ot','gender':'female'},
  {'name':'Boaz','aliases':[],'mother':null,'father':null,'spouse':'Ruth','children':['Obed'],'siblings':[],'occupation':'Wealthy landowner','age_notes':null,'notable_events':['Married Ruth','Kinsman redeemer','Ancestor of David'],'verses':['Ruth 2-4'],'short_bio':'Wealthy man who married Ruth.','testament':'ot','gender':'male'},
  {'name':'Hannah','aliases':[],'mother':null,'father':null,'spouse':'Elkanah','children':['Samuel'],'siblings':[],'occupation':null,'age_notes':null,'notable_events':['Prayed for son','Mother of Samuel','Sang praise song'],'verses':['1 Samuel 1-2'],'short_bio':'Mother of Samuel; prayed faithfully for a son.','testament':'ot','gender':'female'},
  {'name':'Eli','aliases':[],'mother':null,'father':null,'spouse':null,'children':[],'siblings':[],'occupation':'High priest, judge','age_notes':'Died at 98','notable_events':['Mentored Samuel','Sons were wicked','Died hearing of ark capture'],'verses':['1 Samuel 1-4'],'short_bio':'High priest who mentored young Samuel.','testament':'ot','gender':'male'},
  {'name':'Goliath','aliases':[],'mother':null,'father':null,'spouse':null,'children':[],'siblings':[],'occupation':'Philistine warrior','age_notes':'Over 9 feet tall','notable_events':['Defeated by David','Champion of Philistines'],'verses':['1 Samuel 17'],'short_bio':'Giant Philistine warrior defeated by David.','testament':'ot','gender':'male'},
  {'name':'Jonathan','aliases':[],'mother':null,'father':'Saul (first king)','spouse':null,'children':[],'siblings':[],'occupation':'Prince, warrior','age_notes':null,'notable_events':['Best friend of David','Gave David his armor','Died with Saul'],'verses':['1 Samuel 18','1 Samuel 20','1 Samuel 31'],'short_bio':'Son of Saul and loyal friend of David.','testament':'ot','gender':'male'},
  {'name':'Bathsheba','aliases':[],'mother':null,'father':'Eliam','spouse':['Uriah','David'],'children':['Solomon'],'siblings':[],'occupation':null,'age_notes':null,'notable_events':['Committed adultery with David','Mother of Solomon','Husband Uriah killed'],'verses':['2 Samuel 11-12','1 Kings 1'],'short_bio':'Wife of Uriah then David; mother of Solomon.','testament':'ot','gender':'female'},
  {'name':'Absalom','aliases':[],'mother':null,'father':'David','spouse':null,'children':[],'siblings':['Solomon'],'occupation':'Prince','age_notes':null,'notable_events':['Rebelled against David','Known for beautiful hair','Hair caught in tree'],'verses':['2 Samuel 13-18'],'short_bio':'Son of David who rebelled against him.','testament':'ot','gender':'male'},
  {'name':'Elkanah','aliases':[],'mother':null,'father':null,'spouse':['Hannah','Peninnah'],'children':['Samuel'],'siblings':[],'occupation':null,'age_notes':null,'notable_events':['Father of Samuel','Husband of Hannah'],'verses':['1 Samuel 1'],'short_bio':'Father of Samuel; husband of Hannah and Peninnah.','testament':'ot','gender':'male'},
  {'name':'Mordecai','aliases':[],'mother':null,'father':null,'spouse':null,'children':[],'siblings':[],'occupation':'Official','age_notes':null,'notable_events':['Cousin of Esther','Exposed assassination plot','Honored by king'],'verses':['Esther 2-10'],'short_bio':'Cousin of Esther who helped save the Jews.','testament':'ot','gender':'male'},
  {'name':'Haman','aliases':[],'mother':null,'father':'Hammedatha','spouse':null,'children':[],'siblings':[],'occupation':'Official','age_notes':null,'notable_events':['Plotted against Jews','Hanged on own gallows'],'verses':['Esther 3-7'],'short_bio':'Evil official who plotted against the Jews.','testament':'ot','gender':'male'},
  {'name':'John (apostle)','aliases':['John the Beloved'],'mother':null,'father':'Zebedee','spouse':null,'children':[],'siblings':['James'],'occupation':'Fisherman, apostle','age_notes':null,'notable_events':['Beloved disciple','Wrote gospel and Revelation','Exiled to Patmos'],'verses':['John 13:23','John 19:26','Revelation 1:9'],'short_bio':'Beloved disciple who wrote the Gospel of John.','testament':'nt','gender':'male'},
  {'name':'Matthew','aliases':['Levi'],'mother':null,'father':'Alphaeus','spouse':null,'children':[],'siblings':[],'occupation':'Tax collector, apostle','age_notes':null,'notable_events':['Called by Jesus','Wrote gospel','Tax collector'],'verses':['Matthew 9:9','Mark 2:14'],'short_bio':'Tax collector who became apostle; wrote gospel.','testament':'nt','gender':'male'},
  {'name':'Thomas','aliases':['Didymus'],'mother':null,'father':null,'spouse':null,'children':[],'siblings':[],'occupation':'Apostle','age_notes':null,'notable_events':['Doubted resurrection','Touched Jesus' wounds'],'verses':['John 20:24-29'],'short_bio':'Apostle who doubted resurrection until he saw Jesus.','testament':'nt','gender':'male'},
  {'name':'Judas Iscariot','aliases':[],'mother':null,'father':'Simon Iscariot','spouse':null,'children':[],'siblings':[],'occupation':'Apostle, treasurer','age_notes':null,'notable_events':['Betrayed Jesus','Hanged himself','Sold Jesus for 30 silver'],'verses':['Matthew 26:14-16','Matthew 27:3-5'],'short_bio':'Apostle who betrayed Jesus for thirty pieces of silver.','testament':'nt','gender':'male'},
  {'name':'Zacchaeus','aliases':[],'mother':null,'father':null,'spouse':null,'children':[],'siblings':[],'occupation':'Tax collector','age_notes':'Short in stature','notable_events':['Climbed sycamore tree','Restored fourfold','Hosted Jesus'],'verses':['Luke 19:1-10'],'short_bio':'Short tax collector who climbed tree to see Jesus.','testament':'nt','gender':'male'},
  {'name':'Martha','aliases':[],'mother':null,'father':null,'spouse':null,'children':[],'siblings':['Lazarus','Mary (sister of Lazarus)'],'occupation':null,'age_notes':null,'notable_events':['Sister of Mary and Lazarus','Served Jesus','Believed in resurrection'],'verses':['Luke 10:38-42','John 11'],'short_bio':'Sister of Lazarus and Mary who served Jesus.','testament':'nt','gender':'female'},
  {'name':'Mary (sister of Lazarus)','aliases':[],'mother':null,'father':null,'spouse':null,'children':[],'siblings':['Lazarus','Martha'],'occupation':null,'age_notes':null,'notable_events':['Anointed Jesus' feet','Sat at Jesus' feet','Sister of Lazarus'],'verses':['Luke 10:39','John 11','John 12:3'],'short_bio':'Sister of Lazarus who anointed Jesus' feet.','testament':'nt','gender':'female'},
  {'name':'Nicodemus','aliases':[],'mother':null,'father':null,'spouse':null,'children':[],'siblings':[],'occupation':'Pharisee, ruler','age_notes':null,'notable_events':['Visited Jesus at night','Helped bury Jesus','Asked about being born again'],'verses':['John 3','John 19:39'],'short_bio':'Pharisee who visited Jesus by night.','testament':'nt','gender':'male'},
  {'name':'Joseph of Arimathea','aliases':[],'mother':null,'father':null,'spouse':null,'children':[],'siblings':[],'occupation':'Rich man, council member','age_notes':null,'notable_events':['Buried Jesus','Provided tomb','Secret disciple'],'verses':['Matthew 27:57-60','John 19:38'],'short_bio':'Rich man who provided tomb for Jesus.','testament':'nt','gender':'male'},
  {'name':'Stephen','aliases':[],'mother':null,'father':null,'spouse':null,'children':[],'siblings':[],'occupation':'Deacon','age_notes':null,'notable_events':['First Christian martyr','Full of Holy Spirit','Stoned to death'],'verses':['Acts 6-7'],'short_bio':'First Christian martyr; stoned for his faith.','testament':'nt','gender':'male'},
  {'name':'Philip (evangelist)','aliases':[],'mother':null,'father':null,'spouse':null,'children':[],'siblings':[],'occupation':'Deacon, evangelist','age_notes':null,'notable_events':['Baptized Ethiopian eunuch','Preached in Samaria'],'verses':['Acts 8'],'short_bio':'Deacon who evangelized and baptized the Ethiopian.','testament':'nt','gender':'male'},
  {'name':'Barnabas','aliases':['Joseph'],'mother':null,'father':null,'spouse':null,'children':[],'siblings':[],'occupation':'Apostle','age_notes':null,'notable_events':['Traveled with Paul','Sold field for church','Encouraged believers'],'verses':['Acts 4:36-37','Acts 11:22-26','Acts 13-15'],'short_bio':'Companion of Paul; known as \'son of encouragement\'.','testament':'nt','gender':'male'},
  {'name':'Timothy','aliases':[],'mother':'Eunice','father':null,'spouse':null,'children':[],'siblings':[],'occupation':'Pastor, missionary','age_notes':'Young when called','notable_events':['Companion of Paul','Pastor at Ephesus','Received letters from Paul'],'verses':['Acts 16:1','1 Timothy','2 Timothy'],'short_bio':'Young pastor mentored by Paul.','testament':'nt','gender':'male'},
  {'name':'Silas','aliases':['Silvanus'],'mother':null,'father':null,'spouse':null,'children':[],'siblings':[],'occupation':'Prophet, missionary','age_notes':null,'notable_events':['Traveled with Paul','Imprisoned with Paul','Sang in prison'],'verses':['Acts 15:22','Acts 16:25'],'short_bio':'Companion of Paul who sang in prison.','testament':'nt','gender':'male'},
  {'name':'Luke','aliases':[],'mother':null,'father':null,'spouse':null,'children':[],'siblings':[],'occupation':'Physician, historian','age_notes':null,'notable_events':['Wrote gospel and Acts','Traveled with Paul','Beloved physician'],'verses':['Colossians 4:14','2 Timothy 4:11'],'short_bio':'Physician who wrote gospel and book of Acts.','testament':'nt','gender':'male'},
  {'name':'Mark','aliases':['John Mark'],'mother':'Mary','father':null,'spouse':null,'children':[],'siblings':[],'occupation':'Missionary, writer','age_notes':null,'notable_events':['Wrote gospel','Deserted Paul','Restored to ministry'],'verses':['Acts 12:12','Acts 15:37-39','2 Timothy 4:11'],'short_bio':'Writer of the Gospel of Mark.','testament':'nt','gender':'male'},
  {'name':'Pontius Pilate','aliases':[],'mother':null,'father':null,'spouse':null,'children':[],'siblings':[],'occupation':'Roman governor','age_notes':null,'notable_events':['Sentenced Jesus to death','Washed hands','Released Barabbas'],'verses':['Matthew 27','John 18-19'],'short_bio':'Roman governor who sentenced Jesus to crucifixion.','testament':'nt','gender':'male'},
  {'name':'Herod the Great','aliases':[],'mother':null,'father':'Antipater','spouse':null,'children':[],'siblings':[],'occupation':'King','age_notes':null,'notable_events':['Killed babies in Bethlehem','Built temple','Tried to kill Jesus'],'verses':['Matthew 2'],'short_bio':'King who tried to kill baby Jesus.','testament':'ot','gender':'male'},
  {'name':'Elizabeth','aliases':[],'mother':null,'father':null,'spouse':'Zechariah','children':['John the Baptist'],'siblings':[],'occupation':null,'age_notes':'Old when pregnant','notable_events':['Mother of John the Baptist','Wife of Zechariah','Relative of Mary'],'verses':['Luke 1'],'short_bio':'Mother of John the Baptist.','testament':'nt','gender':'female'},
  {'name':'Zechariah','aliases':[],'mother':null,'father':null,'spouse':'Elizabeth','children':['John the Baptist'],'siblings':[],'occupation':'Priest','age_notes':null,'notable_events':['Father of John the Baptist','Made mute by angel','Prophesied at birth'],'verses':['Luke 1'],'short_bio':'Priest who became mute; father of John the Baptist.','testament':'nt','gender':'male'},
  {'name':'Anna','aliases':[],'mother':null,'father':null,'spouse':null,'children':[],'siblings':[],'occupation':'Prophet','age_notes':'84 years old','notable_events':['Recognized baby Jesus','Widow who served in temple','Fasted and prayed'],'verses':['Luke 2:36-38'],'short_bio':'Elderly prophetess who recognized baby Jesus.','testament':'nt','gender':'female'},
  {'name':'Simeon','aliases':[],'mother':null,'father':null,'spouse':null,'children':[],'siblings':[],'occupation':null,'age_notes':'Elderly','notable_events':['Held baby Jesus','Blessed Jesus','Prophesied sword for Mary'],'verses':['Luke 2:25-35'],'short_bio':'Righteous man who blessed baby Jesus in temple.','testament':'nt','gender':'male'}
];

// =========================
// State
// =========================
const state = {
  mode: 'idle', // 'solo' | 'timed' | 'challenge' | 'study'
  score: 0,
  streak: 0,
  qnum: 0,
  qtotal: 0,
  questions: [],
  current: null,
  players: [ { name: 'P1', score: 0 }, { name: 'P2', score: 0 } ],
  currentPlayerIndex: 0,
  timerSecondsRemaining: 0,
  timerId: null,
  people: [],
  results: [],
  paused: false,
  theme: 'night',
  currentPlayer: null  // Stores logged-in player info
};

// =========================
// Player Authentication & Stats
// =========================
function loadPlayer() {
  try {
    const playerData = localStorage.getItem('who-bible-player');
    if (playerData) {
      state.currentPlayer = JSON.parse(playerData);
      return state.currentPlayer;
    }
  } catch(_) {}
  return null;
}

function savePlayer(player) {
  try {
    localStorage.setItem('who-bible-player', JSON.stringify(player));
    state.currentPlayer = player;
  } catch(_) {}
}

function createGuestPlayer(name = 'Guest') {
  return {
    id: 'guest_' + Date.now(),
    name: name || 'Guest',
    isGuest: true,
    stats: initializeStats(),
    createdAt: new Date().toISOString()
  };
}

function createRegisteredPlayer(name, email) {
  return {
    id: 'player_' + Date.now(),
    name: name,
    email: email || '',
    isGuest: false,
    stats: initializeStats(),
    createdAt: new Date().toISOString()
  };
}

function initializeStats() {
  return {
    gamesPlayed: 0,
    totalScore: 0,
    highestScore: 0,
    bestStreak: 0,
    totalCorrect: 0,
    totalQuestions: 0,
    averageScore: 0,
    winRate: 0,
    soloGames: 0,
    timedGames: 0,
    challengeGames: 0,
    lastPlayedAt: null,
    favoriteMode: 'solo'
  };
}

function updatePlayerStats(score, streak, correct, total, mode) {
  if (!state.currentPlayer) return;
  
  const stats = state.currentPlayer.stats;
  stats.gamesPlayed++;
  stats.totalScore += score;
  stats.highestScore = Math.max(stats.highestScore, score);
  stats.bestStreak = Math.max(stats.bestStreak, streak);
  stats.totalCorrect += correct;
  stats.totalQuestions += total;
  stats.averageScore = Math.round(stats.totalScore / stats.gamesPlayed);
  stats.winRate = Math.round((stats.totalCorrect / stats.totalQuestions) * 100);
  stats.lastPlayedAt = new Date().toISOString();
  
  // Track mode preferences
  if (mode === 'solo') stats.soloGames++;
  else if (mode === 'timed') stats.timedGames++;
  else if (mode === 'challenge') stats.challengeGames++;
  
  // Determine favorite mode
  const modes = {
    solo: stats.soloGames,
    timed: stats.timedGames,
    challenge: stats.challengeGames
  };
  stats.favoriteMode = Object.keys(modes).reduce((a, b) => modes[a] > modes[b] ? a : b);
  
  savePlayer(state.currentPlayer);
}

function promptForPlayerName() {
  const currentName = state.currentPlayer ? state.currentPlayer.name : 'Guest';
  const message = getText('enterPlayerName') || `Enter your name (current: ${currentName}):`;
  const name = prompt(message);
  
  if (name === null) {
    // User cancelled - keep current player
    return state.currentPlayer;
  }
  
  if (name && name.trim()) {
    // User entered a name
    const player = createGuestPlayer(name.trim());
    // Preserve stats from previous guest session if transitioning from Guest
    if (state.currentPlayer && state.currentPlayer.name === 'Guest') {
      player.stats = state.currentPlayer.stats;
    }
    state.currentPlayer = player;
    savePlayer(player);
    showToast({ title: getText('welcome') || 'Welcome', msg: `${getText('welcomePlayer') || 'Welcome'}, ${player.name}!`, type: 'success', timeout: 2000 });
    return player;
  } else {
    // User left blank - use Guest
    const player = createGuestPlayer('Guest');
    state.currentPlayer = player;
    savePlayer(player);
    return player;
  }
}

function getPlayerStats() {
  if (!state.currentPlayer) return null;
  return state.currentPlayer.stats;
}

function displayPlayerInfo() {
  if (!state.currentPlayer) return;
  
  const welcomeEl = document.getElementById('welcome-message');
  if (welcomeEl) {
    const stats = state.currentPlayer.stats;
    welcomeEl.innerHTML = `
      <div style="text-align: center; padding: 20px;">
        <h3>Welcome, ${state.currentPlayer.name}!</h3>
        <div style="display: flex; gap: 20px; justify-content: center; margin-top: 16px; flex-wrap: wrap;">
          <div><strong>Games:</strong> ${stats.gamesPlayed}</div>
          <div><strong>High Score:</strong> ${stats.highestScore}</div>
          <div><strong>Best Streak:</strong> ${stats.bestStreak}</div>
          <div><strong>Win Rate:</strong> ${stats.winRate}%</div>
        </div>
      </div>
    `;
  }
  updatePlayerDisplayName();
}

function updatePlayerDisplayName() {
  const playerNameEl = document.getElementById('current-player-name');
  if (playerNameEl && state.currentPlayer) {
    playerNameEl.textContent = state.currentPlayer.name;
  }
}

// =========================
// Elements
// =========================
// Panels
const setupPanel = document.getElementById('setup-panel');
const gameArea = document.getElementById('game-area');
const studyPanel = document.getElementById('study-panel');

// Setup elements
const btnSolo = document.getElementById('btn-solo');
const btnTimed = document.getElementById('btn-timed');
const btnChallenge = document.getElementById('btn-challenge');
const btnStudy = document.getElementById('btn-study');
const difficultySel = document.getElementById('difficulty');
const numQuestionsInput = document.getElementById('num-questions');
const timeLimitInput = document.getElementById('time-limit');
const btnExport = document.getElementById('btn-export');
const btnImport = document.getElementById('btn-import');
const btnResetData = document.getElementById('btn-reset-data');
const fileInput = document.getElementById('file-input');

// Game elements
const btnBackToSetup = document.getElementById('btn-back-to-setup');
const gameTitle = document.getElementById('game-title');
const quizEl = document.getElementById('quiz');
const qText = document.getElementById('question-text');
const answersEl = document.getElementById('answers');
const scoreEl = document.getElementById('score');
const streakEl = document.getElementById('streak');
const qnumEl = document.getElementById('qnum');
const qtotalEl = document.getElementById('qtotal');
const afterRef = document.getElementById('after-ref');
const btnNext = document.getElementById('btn-next');
const btnQuit = document.getElementById('btn-quit');
const btnPause = document.getElementById('btn-pause');
const timerEl = document.getElementById('timer');
const timeRemainingEl = document.getElementById('time-remaining');
const challengeStatusEl = document.getElementById('challenge-status');
const currentPlayerEl = document.getElementById('current-player');
const p1ScoreEl = document.getElementById('p1-score');
const p2ScoreEl = document.getElementById('p2-score');
const progressBarEl = document.getElementById('progress-bar');

// Study elements
const btnBackFromStudy = document.getElementById('btn-back-from-study');
const searchPerson = document.getElementById('search-person');
const sortSelect = document.getElementById('sort-select');
const filterMother = document.getElementById('filter-mother');
const filterOccupation = document.getElementById('filter-occupation');
const filterAge = document.getElementById('filter-age');
const peopleCountEl = document.getElementById('people-count');

// Language selector
const languageSelect = document.getElementById('language-select');
const btnShuffleList = document.getElementById('btn-shuffle-list');
const btnExpandAll = document.getElementById('btn-expand-all');
const btnCollapseAll = document.getElementById('btn-collapse-all');
const peopleList = document.getElementById('people-list');

// Modal elements
const modalEl = document.getElementById('summary-modal');
const summaryStatsEl = document.getElementById('summary-stats');
const summaryListEl = document.getElementById('summary-list');
const btnSummaryClose = document.getElementById('btn-summary-close');
const btnPlayAgain = document.getElementById('btn-play-again');
const playersModal = document.getElementById('players-modal');
const btnPlayersClose = document.getElementById('btn-players-close');
const btnPlayersCancel = document.getElementById('btn-players-cancel');
const btnPlayersStart = document.getElementById('btn-players-start');
const p1NameInput = document.getElementById('p1-name');
const p2NameInput = document.getElementById('p2-name');

// Theme and toasts
const btnTheme = document.getElementById('btn-theme');
const toastContainer = document.getElementById('toast-container');
// Nav
const btnShare = document.getElementById('btn-share');
const navCommunity = document.getElementById('nav-community');
const footerCommunity = document.getElementById('footer-community');

// Community elements
// Community elements removed on main page (moved to community.html)

// =========================
// Translation functions (using centralized JSON translations)
// =========================
function translateEvent(event) {
  if (!event) return event;
  const lang = (typeof currentLanguage !== 'undefined' ? currentLanguage : (window.currentLanguage || 'en'));
  if (lang === 'en') return event;
  try{
    const mapping = (window.TRANSLATIONS && window.TRANSLATIONS[lang] && window.TRANSLATIONS[lang].eventTranslations) || null;
    if(mapping && mapping[event]) return mapping[event];
  }catch(_){ }
  return event; // fallback to original text
}

function translateOccupation(text){
  if(!text) return text;
  const lang = (typeof currentLanguage !== 'undefined' ? currentLanguage : (window.currentLanguage || 'en'));
  if (lang === 'en') return text;
  try{
    const mapping = (window.TRANSLATIONS && window.TRANSLATIONS[lang] && window.TRANSLATIONS[lang].occupationTranslations) || null;
    if(mapping && mapping[text]) return mapping[text];
  }catch(_){ }
  return text; // fallback to original text
}

function translateAnswerForQuestionType(qType, value){
  if(qType==='occupation') return translateOccupation(value);
  if(qType==='age') return translateEvent(value);
  return value; // names and mothers remain as-is
}

// =========================
// Init
// =========================
init();

function init(){
  // Set default settings if not present
  const defaultSettings = {
    difficulty: 'medium',
    numQuestions: 10,
    timeLimit: 60,
    theme: 'night',
    language: 'en'
  };
  let savedSettings = loadSettings();
  if(!savedSettings){
    savedSettings = { ...defaultSettings };
    localStorage.setItem('settings', JSON.stringify(savedSettings));
  }
  // Apply settings to UI and state
  difficultySel.value = savedSettings.difficulty ?? defaultSettings.difficulty;
  numQuestionsInput.value = String(savedSettings.numQuestions ?? defaultSettings.numQuestions);
  timeLimitInput.value = String(savedSettings.timeLimit ?? defaultSettings.timeLimit);
  
  // Ensure theme is applied - force initial application
  const themeToApply = savedSettings.theme || defaultSettings.theme;
  console.log('Initial theme to apply:', themeToApply); // Debug
  applyTheme(themeToApply);
  // Set language
  const savedLang = localStorage.getItem('who-bible-language');
  if (savedLang && TRANSLATIONS[savedLang] !== undefined) {
    setLanguage(savedLang);
  } else if(savedSettings.language && TRANSLATIONS[savedSettings.language] !== undefined) {
    setLanguage(savedSettings.language);
  } else {
    setLanguage(defaultSettings.language);
  }
  state.people = loadPeopleDataFromLocalStorage() || DEFAULT_PEOPLE_DATA.slice();
  
  // Initialize relationship graph
  if (window.RelationshipSystem) {
    RelationshipSystem.buildRelationshipGraph(state.people);
    console.log('✓ Relationship graph built for', state.people.length, 'people');
  }
  
  // Load or create player
  const player = loadPlayer();
  if (player) {
    state.currentPlayer = player;
    displayPlayerInfo();
  } else {
    // Create a guest player by default (no prompt)
    // User can change name later via "Change Player" button
    const guestPlayer = createGuestPlayer('Guest');
    state.currentPlayer = guestPlayer;
    savePlayer(guestPlayer);
    displayPlayerInfo();
  }
  
  renderPeopleList();
  attachHandlers();
  // Footer year
  const fy = document.getElementById('footer-year');
  if (fy) fy.textContent = String(new Date().getFullYear());
  // Welcome toast
  showToast({ title: getText('brandTitle'), msg: getText('welcomeMessage'), type: 'info', timeout: 4000 });
}

function attachHandlers(){
  // Home link handler
  const homeLink = document.getElementById('home-link');
  if (homeLink) {
    homeLink.addEventListener('click', (e)=>{ e.preventDefault(); showSetup(); });
  }
  
  // Player management
  const btnChangePlayer = document.getElementById('btn-change-player');
  if (btnChangePlayer) {
    btnChangePlayer.addEventListener('click', ()=>{
      const newPlayer = promptForPlayerName();
      if (newPlayer) {
        displayPlayerInfo();
        updatePlayerDisplayName();
      }
    });
  }
  
  // Mode buttons
  btnSolo.addEventListener('click', startSolo);
  btnTimed.addEventListener('click', startTimed);
  btnChallenge.addEventListener('click', startChallenge);
  btnStudy.addEventListener('click', startStudy);
  
  // Navigation
  btnBackToSetup.addEventListener('click', showSetup);
  btnBackFromStudy.addEventListener('click', showSetup);
  // Community moved to separate page
  
  // Game controls
  btnNext.addEventListener('click', nextQuestion);
  btnQuit.addEventListener('click', quitQuiz);
  btnPause.addEventListener('click', togglePause);
  
  // Study controls
  searchPerson.addEventListener('input', e=>renderPeopleList(e.target.value));
  sortSelect.addEventListener('change', ()=>renderPeopleList(searchPerson.value));
  filterMother.addEventListener('change', ()=>renderPeopleList(searchPerson.value));
  filterOccupation.addEventListener('change', ()=>renderPeopleList(searchPerson.value));
  filterAge.addEventListener('change', ()=>renderPeopleList(searchPerson.value));
  btnShuffleList.addEventListener('click', ()=>{ shuffle(state.people); renderPeopleList(searchPerson.value); });
  btnExpandAll.addEventListener('click', ()=>toggleAllDetails(true));
  btnCollapseAll.addEventListener('click', ()=>toggleAllDetails(false));
  
  // Testament and gender filters
  const testamentFilter = document.getElementById('testament-filter');
  const genderFilter = document.getElementById('gender-filter');
  if (testamentFilter) {
    testamentFilter.addEventListener('change', ()=>renderPeopleList(searchPerson.value));
  }
  if (genderFilter) {
    genderFilter.addEventListener('change', ()=>renderPeopleList(searchPerson.value));
  }
  
  // Data management
  btnExport.addEventListener('click', exportJson);
  btnImport.addEventListener('click', ()=>fileInput.click());
  btnResetData.addEventListener('click', resetData);
  fileInput.addEventListener('change', handleImportFile);
  
  // Settings persistence
  difficultySel.addEventListener('change', saveSettingsFromUI);
  numQuestionsInput.addEventListener('change', saveSettingsFromUI);
  timeLimitInput.addEventListener('change', saveSettingsFromUI);
  
  // Language selector
  languageSelect.addEventListener('change', (e) => {
    const lang = e.target.value;
    // Persist preferred language as part of settings as well
    const settings = loadSettings() || {};
    settings.language = lang;
    try{ localStorage.setItem('settings', JSON.stringify(settings)); }catch(_){/* ignore */}
    setLanguage(lang);
    // Re-render visible question if any
    if(state.current){
      // Rebuild prompt with translated pieces when possible
      const q = state.current;
      // We cannot perfectly rebuild dynamic tokens here without source data; keep prompt as-is,
      // but refresh choices labels and status/headers via updateAllText called by setLanguage.
      // Future: store raw tokens to fully re-localize prompt.
      // Refresh answers display text
      const nodes = Array.from(document.querySelectorAll('#answers .ans'));
      nodes.forEach(node=>{
        const orig = node.dataset.value;
        node.innerText = (typeof translateAnswerForQuestionType==='function') ? translateAnswerForQuestionType(q.type, orig) : orig;
      });
    }
  });
  
  // Theme toggle: cycle between day and night
  if (btnTheme) {
    btnTheme.addEventListener('click', ()=>{
      console.log('Theme button clicked!'); // Debug
      console.log('Current state.theme:', state.theme); // Debug
      console.log('Body classes:', document.body.className); // Debug
      
      // Use state.theme as the source of truth
      const current = state.theme || 'night';
      const next = current === 'night' ? 'day' : 'night';
      
      console.log('Switching from', current, 'to', next); // Debug
      applyTheme(next);
      saveSettingsFromUI();
    });
  } else {
    console.log('btnTheme not found!'); // Debug
  }
  // Share
  if (btnShare) {
    btnShare.addEventListener('click', async ()=>{
      const shareData = {
        title: 'Who-Bible',
        text: getText('brandDesc'),
        url: location.href
      };
      if (navigator.share) {
        try { await navigator.share(shareData); } catch(_){}
      } else {
        try {
          await navigator.clipboard.writeText(`${shareData.title} — ${shareData.url}`);
          showToast({ title: getText('exportSuccess'), msg: getText('exportMsg'), type: 'success', timeout: 1500 });
        } catch(_) {
          showToast({ title: getText('importError'), msg: 'Clipboard unavailable', type: 'error', timeout: 1500 });
        }
      }
    });
  }
  // Community placeholder behavior
  // Community opens in a new tab via anchor href
  
  // Modal handlers
  btnSummaryClose.addEventListener('click', hideSummaryModal);
  btnPlayAgain.addEventListener('click', ()=>{ hideSummaryModal(); showSetup(); });
  btnPlayersClose.addEventListener('click', hidePlayersModal);
  btnPlayersCancel.addEventListener('click', hidePlayersModal);
  btnPlayersStart.addEventListener('click', startChallengeFromModal);
  
  // Keyboard navigation on answers
  answersEl.addEventListener('keydown', onAnswersKeyDown);

}

// =========================
// Panel Management
// =========================
function showSetup(){
  setupPanel.style.display = 'flex';
  gameArea.style.display = 'none';
  studyPanel.style.display = 'none';
  stopTimer();
  // Reset quiz display
  const quizEl = document.getElementById('quiz');
  const welcomeMsg = document.getElementById('welcome-message');
  if(quizEl) quizEl.style.display = 'none';
  if(welcomeMsg) welcomeMsg.style.display = 'block';
  // Reset question number display
  if(typeof qnumEl !== 'undefined' && typeof qtotalEl !== 'undefined') {
    qnumEl.innerText = '0';
    // set total to selected number of questions for clarity
    const selected = parseInt(numQuestionsInput.value)||10;
    qtotalEl.innerText = String(selected);
  }
}

function showGame(){
  setupPanel.style.display = 'none';
  gameArea.style.display = 'flex';
  studyPanel.style.display = 'none';
}

function showStudy(){
  setupPanel.style.display = 'none';
  gameArea.style.display = 'none';
  studyPanel.style.display = 'flex';
  renderPeopleList();
}

// Community removed from main SPA; use community.html

// Community helpers
// Community modal lives on community.html

function initialsFromName(name){
  const parts = (name||'').trim().split(/[\s-]+/).filter(Boolean);
  if(parts.length===0) return 'WB';
  const first = parts[0][0] || '';
  const second = parts.length>1 ? parts[1][0] : '';
  return (first+second).toUpperCase();
}
function generateAvatarText(name){
  const txt = initialsFromName(name);
  return txt || 'WB';
}
// Avatar helpers moved to community.js
// Profile helpers moved to community.js

function escapeHtml(s){
  return String(s).replace(/[&<>"]+/g, ch=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;"}[ch]));
}

// setActiveCommunityTab moved to community.js

// =========================
// Modes
// =========================
function startSolo(){
  showGame();
  gameTitle.textContent = getText('soloMode');
  prepareQuiz('solo');
  showToast({ title: getText('soloStart'), msg: getText('soloStartMsg'), type: 'info' });
}

function startTimed(){
  showGame();
  gameTitle.textContent = getText('timedMode');
  prepareQuiz('timed');
  const secs = parseInt(timeLimitInput.value)||60;
  showToast({ title: getText('timedStart'), msg: getText('timedStartMsg'), type: 'warn' });
}

function startChallenge(){
  showPlayersModal();
}

function startChallengeFromModal(){
  const name1 = (p1NameInput.value||'Player 1').trim() || 'Player 1';
  const name2 = (p2NameInput.value||'Player 2').trim() || 'Player 2';
  hidePlayersModal();
  showGame();
  gameTitle.textContent = getText('challengeMode');
  
  // Challenge mode uses temporary players for this session only
  // Does not affect the main player profile/stats
  state.players = [ 
    { name: name1, score: 0 }, 
    { name: name2, score: 0 } 
  ];
  state.currentPlayerIndex = 0;
  currentPlayerEl.textContent = '1';
  p1ScoreEl.textContent = '0';
  p2ScoreEl.textContent = '0';
  prepareQuiz('challenge');
  showToast({ 
    title: getText('challengeStart'), 
    msg: `${name1} vs ${name2}! ${getText('challengeStartMsg')}`, 
    type: 'info' 
  });
}

function startStudy(){
  showStudy();
  showToast({ title: getText('studyStart'), msg: getText('studyStartMsg'), type: 'info' });
}

function prepareQuiz(mode){
  state.mode = mode;
  afterRef.innerText='';
  state.score = 0; state.streak = 0; state.qnum = 0; state.results = []; state.paused = false;
  const count = parseInt(numQuestionsInput.value) || 10;
  const difficulty = difficultySel.value;
  
  // Apply testament and gender filters to the people pool
  let peoplePool = state.people.slice();
  const testamentFilter = document.getElementById('testament-filter');
  const genderFilter = document.getElementById('gender-filter');
  
  if (testamentFilter && testamentFilter.value !== 'all') {
    peoplePool = peoplePool.filter(p => p.testament === testamentFilter.value);
  }
  
  if (genderFilter && genderFilter.value !== 'all') {
    peoplePool = peoplePool.filter(p => p.gender === genderFilter.value);
  }
  
  state.questions = pickQuestionSet(count, difficulty, peoplePool);
  state.qtotal = state.questions.length;
  qtotalEl.innerText = state.qtotal;
  scoreEl.innerText = state.score;
  streakEl.innerText = state.streak;
  btnNext.disabled = true;
  
  // Show the quiz interface
  quizEl.style.display = 'block';
  
  // Hide welcome message and show quiz content
  const welcomeMsg = document.getElementById('welcome-message');
  if(welcomeMsg) welcomeMsg.style.display = 'none';
  
  // Configure mode-specific elements
  timerEl.style.display = (mode==='timed') ? 'inline-flex' : 'none';
  btnPause.style.display = (mode==='timed') ? 'inline-block' : 'none';
  challengeStatusEl.style.display = (mode==='challenge') ? 'inline-flex' : 'none';
  
  if(mode==='timed'){
    const secs = parseInt(timeLimitInput.value) || 60;
    startTimer(secs);
    scheduleTimeWarnings();
  } else {
    stopTimer();
  }
  nextQuestion();
}

function quitQuiz(){
  showSetup();
}

// =========================
// Questions
// =========================
function pickQuestionSet(count, difficulty, peoplePool = null){
  const types = ['whoDid','whoMother','occupation','age','event'];
  const pool = filterPeopleByDifficulty(peoplePool || state.people, difficulty);
  shuffle(pool);
  const selected = pool.slice(0, Math.min(count, pool.length));
  const questions = [];
  for(const person of selected){
    const t = types[Math.floor(Math.random()*types.length)];
    if(t==='whoDid'){
      const rawEvent = person.notable_events?.[0] || getText('fallbackEvent');
      // Store raw token to allow re-localization on language change
      const event = translateEvent(rawEvent);
      questions.push({type:'whoDid',prompt:getText('questionWhoDid', {event}),answer:person.name,ref:person.verses, raw:{ event: rawEvent }});
    }else if(t==='whoMother'){
      if(person.mother) questions.push({type:'whoMother',prompt:getText('questionWhoMother', {name: person.name}),answer:person.mother,ref:person.verses, raw:{ name: person.name }});
    }else if(t==='occupation'){
      if(person.occupation) questions.push({type:'occupation',prompt:getText('questionOccupation', {name: person.name}),answer:person.occupation,ref:person.verses, raw:{ occupation: person.occupation, name: person.name }});
    }else if(t==='age'){
      if(person.age_notes) questions.push({type:'age',prompt:getText('questionAge', {name: person.name}),answer:person.age_notes,ref:person.verses, raw:{ name: person.name, age: person.age_notes }});
    }else if(t==='event'){
      if(person.notable_events && person.notable_events.length>0) {
        const rawEvent = person.notable_events[0];
        const event = translateEvent(rawEvent);
        questions.push({type:'event',prompt:getText('questionEvent', {event}),answer:person.name,ref:person.verses, raw:{ event: rawEvent }});
      }
    }
  }
  // ensure we have at least count questions; fill with simple ones
  let i = 0;
  while(questions.length < count && i < state.people.length){
    const p = state.people[i++];
    const rawEvent = p.notable_events?.[0] || getText('fallbackEvent');
    const event = translateEvent(rawEvent);
    questions.push({type:'whoDid',prompt:getText('questionWhoDid', {event}),answer:p.name,ref:p.verses});
  }
  return questions.slice(0, count);
}

function filterPeopleByDifficulty(people, difficulty){
  if(difficulty==='easy'){
    const common = new Set(['Noah','Moses','David','Solomon','Abraham','Isaac','Jacob','Ruth','Esther','Peter','Paul','Mary (mother of Jesus)','John the Baptist','Joseph (son of Jacob)','Lazarus']);
    return people.filter(p=>common.has(p.name));
  }
  if(difficulty==='hard'){
    // Prefer entries with less-complete bios (harder), but include all
    const scored = people.map(p=>({
      p,
      score: (p.occupation?0:1) + (p.mother?0:1) + (p.age_notes?0:1) + ((p.notable_events?.length||0) < 1 ? 1 : 0)
    }));
    scored.sort((a,b)=>b.score-a.score);
    return scored.map(s=>s.p);
  }
  return people.slice();
}

function nextQuestion(){
  if(state.qnum >= state.qtotal){ endQuiz(); return; }
  state.current = state.questions[state.qnum];
  state.qnum++;
  qnumEl.innerText = state.qnum;
  scoreEl.innerText = state.score;
  streakEl.innerText = state.streak;
  renderQuestion(state.current);
  updateProgress();
}

function renderQuestion(q){
  // If the question has raw tokens, regenerate localized prompt to respect current language
  if(q && q.raw){
    if(q.type==='whoDid' || q.type==='event'){
      const ev = translateEvent(q.raw.event);
      qText.innerText = getText(q.type==='whoDid' ? 'questionWhoDid' : 'questionEvent', { event: ev });
    } else if(q.type==='occupation'){
      qText.innerText = getText('questionOccupation', { name: q.raw.name });
    } else if(q.type==='whoMother'){
      qText.innerText = getText('questionWhoMother', { name: q.raw.name });
    } else if(q.type==='age'){
      qText.innerText = getText('questionAge', { name: q.raw.name });
    } else {
      qText.innerText = q.prompt;
    }
  } else {
    qText.innerText = q.prompt;
  }
  afterRef.innerText='';
  btnNext.disabled = true;
  answersEl.innerHTML='';
  answersEl.setAttribute('aria-activedescendant','');
  answersEl.setAttribute('aria-label', getText('answersLabel'));
  const choices = makeChoices(q);
  choices.forEach((choiceObj, idx)=>{
    const div = document.createElement('div');
    div.className='ans';
    div.tabIndex=0;
    div.id = `choice-${idx+1}`;
    div.setAttribute('role','option');
    div.setAttribute('aria-selected','false');
    div.innerText = choiceObj.display;
    div.dataset.value = choiceObj.original;
    div.addEventListener('click',()=>handleAnswer(choiceObj.original,q,div));
    answersEl.appendChild(div);
  });
  // Focus first choice for accessibility
  const first = answersEl.querySelector('.ans');
  if(first) first.focus();
}

function makeChoices(q){
  const set = new Set([q.answer]);
  const distractors = getDistractors(q);
  for(const d of distractors){
    set.add(d);
    if(set.size>=4) break;
  }
  // Fallback to names if not enough
  const names = state.people.map(p=>p.name);
  while(set.size<4){
    const pick = names[Math.floor(Math.random()*names.length)];
    set.add(pick);
  }
  const arr = Array.from(set).map(original=>({ original, display: translateAnswerForQuestionType(q.type, original) }));
  shuffle(arr);
  return arr;
}

function getDistractors(q){
  const results = [];
  if(q.type==='occupation'){
    const pool = state.people.map(p=>p.occupation).filter(Boolean).filter(x=>normalize(x)!==normalize(q.answer));
    shuffle(pool); results.push(...pool);
  } else if(q.type==='age'){
    const pool = state.people.map(p=>p.age_notes).filter(Boolean).filter(x=>normalize(x)!==normalize(q.answer));
    shuffle(pool); results.push(...pool);
  } else if(q.type==='whoMother'){
    const pool = state.people.map(p=>p.mother).filter(Boolean).filter(x=>normalize(x)!==normalize(q.answer));
    shuffle(pool); results.push(...pool);
  } else {
    const pool = state.people.map(p=>p.name).filter(x=>normalize(x)!==normalize(q.answer));
    shuffle(pool); results.push(...pool);
  }
  return results;
}

function handleAnswer(choice,q, el){
  // Disable further answers; mark correctness
  const correct = normalize(choice) === normalize(q.answer);
  const ansNodes = Array.from(answersEl.querySelectorAll('.ans'));
  ansNodes.forEach(node=>{
    node.classList.add('disabled');
  if(normalize(node.dataset.value) === normalize(q.answer)) node.classList.add('correct');
  });
  if(!correct) el.classList.add('incorrect');

  // Visual feedback simplified (no animations)

  if(correct){
    state.score += 10;
    state.streak += 1;
  afterRef.innerText = `${getText('correctAnswer')} — ${getText('references')}: ` + (q.ref||[]).join(', ');
    if(state.mode==='challenge'){
      state.players[state.currentPlayerIndex].score += 10;
      updateChallengeScores();
    }
    showToast({ title: getText('correctAnswer'), msg: getText('correctMsg'), type: 'success', timeout: 1500 });
  }else{
    state.streak = 0;
  afterRef.innerText = `${getText('wrongAnswer')}. ${getText('correctLabel')}: ${translateAnswerForQuestionType(q.type, q.answer)}. ${getText('references')}: ${(q.ref||[]).join(', ')}`;
  showToast({ title: getText('wrongAnswer'), msg: getText('wrongMsg', { answer: translateAnswerForQuestionType(q.type, q.answer) }), type: 'error', timeout: 1800 });
  }

  scoreEl.innerText = state.score;
  streakEl.innerText = state.streak;

  // Record result
  state.results.push({ 
    prompt: q.prompt, 
    chosen: choice, 
    correctAnswer: q.answer, 
    chosenDisplay: translateAnswerForQuestionType(q.type, choice),
    correctDisplay: translateAnswerForQuestionType(q.type, q.answer),
    correct, 
    ref: q.ref||[] 
  });

  // For challenge mode, alternate player each question
  if(state.mode==='challenge'){
    state.currentPlayerIndex = (state.currentPlayerIndex + 1) % 2;
    currentPlayerEl.textContent = String(state.currentPlayerIndex + 1);
    const nextName = state.players[state.currentPlayerIndex].name;
    showToast({ title: getText('challengeTurn', { player: nextName }), msg: getText('challengeTurnMsg', { player: nextName }), type: 'info', timeout: 1200 });
  }

  btnNext.disabled = false;
}

function updateChallengeScores(){
  p1ScoreEl.textContent = String(state.players[0].score);
  p2ScoreEl.textContent = String(state.players[1].score);
}

function endQuiz(){
  let endText = `${getText('quizComplete')}! ${getText('yourScore')}: ${state.score}`;
  if(state.mode==='challenge'){
    const [p1,p2] = state.players;
    const isTie = p1.score === p2.score;
    const winnerName = p1.score > p2.score ? p1.name : p2.name;
    endText += ` — ${isTie ? getText('tieGame') : getText('winner') + ': ' + winnerName}`;
  }
  qText.innerText = endText;
  answersEl.innerHTML='';
  afterRef.innerText='';
  stopTimer();
  
  // Update player statistics
  const correctAnswers = state.results.filter(r => r.correct).length;
  const totalQuestions = state.results.length;
  updatePlayerStats(state.score, state.streak, correctAnswers, totalQuestions, state.mode);
  
  state.current=null; state.questions=[]; state.qnum=0; state.qtotal=0;
  btnNext.disabled = true;

  // Show summary modal
  showSummaryModal();
  showToast({ title: getText('quizComplete'), msg: `${getText('yourScore')}: ${state.score}${state.mode==='challenge'?`. ${winnerText()}`:''}`, type: 'success', timeout: 5000 });
}

function winnerText(){
  const [p1,p2] = state.players;
  if(p1.score===p2.score) return getText('tieGame');
  return `${getText('winner')}: ${p1.score>p2.score?p1.name:p2.name}`;
}

// =========================
// Timer
// =========================
function startTimer(seconds){
  stopTimer();
  state.timerSecondsRemaining = seconds;
  timeRemainingEl.textContent = String(state.timerSecondsRemaining);
  timerEl.style.display = 'inline-flex';
  state.timerId = setInterval(()=>{
    if(state.paused) return;
    state.timerSecondsRemaining -= 1;
    timeRemainingEl.textContent = String(Math.max(0, state.timerSecondsRemaining));
    // Timer styling thresholds
    timerEl.classList.remove('warn','danger');
    if(state.timerSecondsRemaining <= 5) timerEl.classList.add('danger');
    else if(state.timerSecondsRemaining <= 15) timerEl.classList.add('warn');
    if(state.timerSecondsRemaining <= 0){
      stopTimer();
  showToast({ title: getText('timeUp'), msg: getText('timeUpMsg'), type: 'warn', timeout: 2000 });
      endQuiz();
    }
  },1000);
}

function stopTimer(){
  if(state.timerId){
    clearInterval(state.timerId);
    state.timerId = null;
  }
}

function togglePause(){
  if(state.mode!=='timed') return;
  state.paused = !state.paused;
  btnPause.textContent = state.paused ? getText('resume') : getText('pause');
  showToast({ title: state.paused ? getText('paused') : getText('resumed'), msg: state.paused ? getText('timerPaused') : getText('timerRunning'), type: 'info', timeout: 1200 });
}

// =========================
// Study/Lookup
// =========================
function renderPeopleList(filter){
  peopleList.innerHTML='';
  let arr = state.people.filter(p=>!filter || p.name.toLowerCase().includes(filter.toLowerCase()));
  
  // Apply existing filters
  if(filterMother?.checked) arr = arr.filter(p=>!!p.mother);
  if(filterOccupation?.checked) arr = arr.filter(p=>!!p.occupation);
  if(filterAge?.checked) arr = arr.filter(p=>!!p.age_notes);
  
  // Apply testament filter (from setup panel if available)
  const testamentFilter = document.getElementById('testament-filter');
  if (testamentFilter && testamentFilter.value !== 'all') {
    arr = arr.filter(p => p.testament === testamentFilter.value);
  }
  
  // Apply gender filter (from setup panel if available)
  const genderFilter = document.getElementById('gender-filter');
  if (genderFilter && genderFilter.value !== 'all') {
    arr = arr.filter(p => p.gender === genderFilter.value);
  }
  if(sortSelect){
    if(sortSelect.value==='name-asc') arr.sort((a,b)=>a.name.localeCompare(b.name));
    if(sortSelect.value==='name-desc') arr.sort((a,b)=>b.name.localeCompare(a.name));
  }
  if(peopleCountEl) peopleCountEl.textContent = String(arr.length);
  for(const p of arr){
    const item = document.createElement('div');
    item.className = 'person-item';
    const header = document.createElement('div');
    header.className = 'person-header';
    header.innerHTML = `<strong>${p.name}</strong> <span class="muted">${(p.short_bio||'').slice(0,80)}</span>`;
    const details = document.createElement('div');
    details.className = 'person-details';
    details.style.display = 'none';
    const aliasLabel = getText('aliases');
    const motherLabel = getText('filterMother');
    const occupationLabel = getText('filterOccupation');
    const ageLabel = getText('filterAge');
    const eventsLabel = getText('events');
    const versesLabel = getText('verses');
    const eventsJoined = (p.notable_events||[]).map(translateEvent).join(', ');
    
    // Build relationship badges
    let relationshipBadges = '';
    if (window.RelationshipSystem) {
      const suggestions = RelationshipSystem.getSuggestions(p.name, state.people, 3);
      
      // Family badge
      if (suggestions.family && suggestions.family.length > 0) {
        const familyNames = suggestions.family.map(rel => `${rel.name} (${rel.relationship})`).join(', ');
        relationshipBadges += `<div class="person-badge">👨‍👩‍👦 ${familyNames}</div>`;
      }
      
      // Testament badge
      if (p.testament) {
        const testamentText = p.testament === 'ot' ? '📜 Old Testament' : '✝️ New Testament';
        relationshipBadges += `<div class="person-badge">${testamentText}</div>`;
      }
      
      // Occupation group badge
      if (suggestions.sameOccupation && suggestions.sameOccupation.length > 0) {
        const occGroup = RelationshipSystem.categorizeOccupation(p.occupation);
        const occIcon = occGroup === 'prophet' ? '🔮' : occGroup === 'ruler' ? '👑' : occGroup === 'priest' ? '⛪' : occGroup === 'apostle' ? '✝️' : '👔';
        const occNames = suggestions.sameOccupation.slice(0, 2).map(o => o.name).join(', ');
        relationshipBadges += `<div class="person-badge">${occIcon} ${occNames}</div>`;
      }
    }
    
    details.innerHTML = `
      ${relationshipBadges}
      ${p.aliases?.length?`<div><strong>${aliasLabel}:</strong> ${p.aliases.join(', ')}</div>`:''}
      ${p.mother?`<div><strong>${motherLabel}:</strong> ${p.mother}</div>`:''}
      ${p.father?`<div><strong>Father:</strong> ${p.father}</div>`:''}
      ${p.spouse?`<div><strong>Spouse:</strong> ${Array.isArray(p.spouse) ? p.spouse.join(', ') : p.spouse}</div>`:''}
      ${p.children?.length?`<div><strong>Children:</strong> ${p.children.join(', ')}</div>`:''}
      ${p.occupation?`<div><strong>${occupationLabel}:</strong> ${p.occupation}</div>`:''}
      ${p.age_notes?`<div><strong>${ageLabel}:</strong> ${p.age_notes}</div>`:''}
      ${p.notable_events?.length?`<div><strong>${eventsLabel}:</strong> ${eventsJoined}</div>`:''}
      <div class="ref"><strong>${versesLabel}:</strong> ${p.verses?.join(', ')||''}</div>
    `;
    header.addEventListener('click',()=>{
      details.style.display = details.style.display==='none' ? 'block' : 'none';
    });
    item.appendChild(header);
    item.appendChild(details);
    peopleList.appendChild(item);
  }
}

function toggleAllDetails(expand){
  const items = peopleList.querySelectorAll('.person-details');
  items.forEach(el=>{ el.style.display = expand ? 'block' : 'none'; });
}

// =========================
// Import/Export & Persistence
// =========================
function exportJson(){
  const json = JSON.stringify(state.people,null,2);
  // Download as file
  const blob = new Blob([json],{type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href=url; a.download='people_data.json'; a.click(); URL.revokeObjectURL(url);
  // Also try to copy to clipboard for convenience
  if(navigator && navigator.clipboard && navigator.clipboard.writeText){
    navigator.clipboard.writeText(json).then(()=>{
      showToast({ title: getText('exportSuccess'), msg: getText('exportMsg'), type: 'success', timeout: 1800 });
    }).catch(()=>{
      // Clipboard failed; still show download success
      showToast({ title: getText('exportSuccess'), msg: getText('exportMsg'), type: 'success', timeout: 1800 });
    });
  } else {
    showToast({ title: getText('exportSuccess'), msg: getText('exportMsg'), type: 'success', timeout: 1800 });
  }
}

async function handleImportFile(e){
  const f = e.target.files?.[0]; if(!f) return;
  const txt = await f.text();
  try{
    const parsed = JSON.parse(txt);
    if(!Array.isArray(parsed)){
      showToast({ title: getText('importError'), msg: getText('importErrorMsg'), type: 'error' });
    } else {
      // Validate each item and collect errors
      const errors = [];
      const valid = [];
      parsed.forEach((item, idx)=>{
        const res = validatePerson(item);
        if(res.valid) valid.push(item);
        else errors.push(`Item ${idx+1}: ${res.reason}`);
      });
      if(errors.length){
        const msg = `${getText('importError')}: ${errors.slice(0,5).join('; ')}${errors.length>5?` (+${errors.length-5} more)`:''}`;
        showToast({ title: getText('importError'), msg, type: 'error', timeout: 5000 });
      }
      if(valid.length>0){
        state.people = valid;
        savePeopleDataToLocalStorage(valid);
        renderPeopleList();
        showToast({ title: getText('importSuccess'), msg: getText('importMsg'), type: 'success' });
      }
    }
  }catch(err){
    showToast({ title: getText('importError'), msg: (err?.message||String(err)), type: 'error' });
  } finally {
    e.target.value = '';
  }
}

// Simple runtime validation for imported person objects
function validatePerson(p){
  if(!p || typeof p !== 'object') return { valid:false, reason: 'Not an object' };
  if(!p.name || typeof p.name !== 'string' || !p.name.trim()) return { valid:false, reason: 'Missing or invalid "name"' };
  if(p.aliases && !Array.isArray(p.aliases)) return { valid:false, reason: '"aliases" must be an array if present' };
  if(p.mother && typeof p.mother !== 'string') return { valid:false, reason: '"mother" must be a string if present' };
  if(p.occupation && typeof p.occupation !== 'string') return { valid:false, reason: '"occupation" must be a string if present' };
  if(p.age_notes && typeof p.age_notes !== 'string') return { valid:false, reason: '"age_notes" must be a string if present' };
  if(p.notable_events && !Array.isArray(p.notable_events)) return { valid:false, reason: '"notable_events" must be an array if present' };
  if(p.verses && !Array.isArray(p.verses)) return { valid:false, reason: '"verses" must be an array if present' };
  // short_bio optional but should be string if present
  if(p.short_bio && typeof p.short_bio !== 'string') return { valid:false, reason: '"short_bio" must be a string if present' };
  return { valid:true };
}

function resetData(){
  if(confirm(getText('resetConfirm'))){
    localStorage.removeItem('peopleData');
    state.people = DEFAULT_PEOPLE_DATA.slice();
    renderPeopleList();
    showToast({ title: getText('resetSuccess'), msg: getText('resetMsg'), type: 'success' });
  }
}

function savePeopleDataToLocalStorage(arr){
  try{ localStorage.setItem('peopleData', JSON.stringify(arr)); }catch(_){/* ignore */}
}

function loadPeopleDataFromLocalStorage(){
  try{
    const txt = localStorage.getItem('peopleData');
    if(!txt) return null;
    const parsed = JSON.parse(txt);
    return Array.isArray(parsed) ? parsed : null;
  }catch(_){ return null; }
}

// =========================
// Utilities
// =========================
function normalize(s){ return (s||'').toString().trim().toLowerCase(); }
function shuffle(a){ for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]} }

function onAnswersKeyDown(e){
  const items = Array.from(answersEl.querySelectorAll('.ans'));
  if(items.length===0) return;
  const idx = items.findIndex(x=>x===document.activeElement);
  if(e.key==='ArrowDown'){
    e.preventDefault();
    const next = items[(idx+1+items.length)%items.length]; next?.focus();
  }else if(e.key==='ArrowUp'){
    e.preventDefault();
    const prev = items[(idx-1+items.length)%items.length]; prev?.focus();
  }else if(e.key==='Enter'){
    e.preventDefault();
    document.activeElement?.click();
  }else if(/^[1-4]$/.test(e.key)){
    e.preventDefault();
    const num = parseInt(e.key,10);
    const target = items[num-1]; target?.click();
  }else if(e.key.toLowerCase()==='n'){
    if(!btnNext.disabled) btnNext.click();
  }else if(e.key.toLowerCase()==='q'){
    btnQuit.click();
  }
}

function updateProgress(){
  if(!progressBarEl) return;
  const answered = Math.max(0, state.qnum - 1);
  const pct = state.qtotal ? Math.round((answered / state.qtotal) * 100) : 0;
  progressBarEl.style.width = pct + '%';
}

// Theme
function applyTheme(theme){
  console.log('applyTheme called with:', theme); // Debug
  state.theme = theme;
  // Remove all theme classes first
  document.body.classList.remove('day', 'night');
  
  // Apply the new theme
  if(theme === 'day') {
    document.body.classList.add('day');
    console.log('Applied day theme'); // Debug
  } else {
    // Default to night theme
    document.body.classList.add('night');
    theme = 'night'; // Normalize to night if invalid theme
    console.log('Applied night theme'); // Debug
  }
  
  // Update theme toggle button tooltip
  const themeKey = theme === 'day' ? 'themeDay' : 'themeNight';
  const keyText = getText(themeKey) || (theme === 'day' ? 'Day' : 'Night');
  if(btnTheme) btnTheme.setAttribute('title', `Toggle theme — ${keyText}`);
}

function saveSettingsFromUI(){
  const settings = {
    difficulty: difficultySel.value,
    numQuestions: parseInt(numQuestionsInput.value)||10,
    timeLimit: parseInt(timeLimitInput.value)||60,
    theme: state.theme
  };
  try{ localStorage.setItem('settings', JSON.stringify(settings)); }catch(_){/* ignore */}
}

function loadSettings(){
  try{
    const txt = localStorage.getItem('settings');
    if(!txt) return null;
    return JSON.parse(txt);
  }catch(_){ return null; }
}

// Summary modal
function showSummaryModal(){
  if(!modalEl) return;
  const total = state.results.length;
  const correct = state.results.filter(r=>r.correct).length;
  const accuracy = total ? Math.round((correct/total)*100) : 0;
  summaryStatsEl.innerHTML = getText('summaryStats', { score: correct, total: total, percentage: accuracy, streak: state.streak });
  summaryListEl.innerHTML = '';
  state.results.forEach(r=>{
    const div = document.createElement('div');
    div.className = 'summary-item ' + (r.correct?'correct':'incorrect');
    div.innerHTML = `
      <div><strong>${getText('questionLabelShort')}:</strong> ${r.prompt}</div>
  <div><strong>${getText('yourAnswer')}:</strong> ${r.chosenDisplay}</div>
  <div><strong>${getText('correctLabel')}:</strong> ${r.correctDisplay}</div>
      <div class="ref"><strong>${getText('references')}:</strong> ${(r.ref||[]).join(', ')}</div>
    `;
    summaryListEl.appendChild(div);
  });
  modalEl.style.display = 'flex';
}

function hideSummaryModal(){
  if(modalEl) modalEl.style.display = 'none';
}

// Players modal
function showPlayersModal(){
  p1NameInput.value = 'P1';
  p2NameInput.value = 'P2';
  playersModal.style.display = 'flex';
}

function hidePlayersModal(){
  playersModal.style.display = 'none';
}

// =========================
// Toasts
// =========================
function showToast({ title, msg, type='info', timeout=3000 }){
  if(!toastContainer) return;
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = `
    <div>
      <div class="title">${title||''}</div>
      <div class="msg">${msg||''}</div>
    </div>
    <div class="close" aria-label="Close">✕</div>
  `;
  const closer = el.querySelector('.close');
  closer.addEventListener('click',()=>{ el.remove(); });
  // Append without affecting layout (container is fixed and centered)
  toastContainer.appendChild(el);
  if(timeout>0){ setTimeout(()=>{ el.remove(); }, timeout); }
}

function scheduleTimeWarnings(){
  if(state.mode!=='timed') return;
  // Lightweight warnings when passing thresholds
  const warnAt = new Set([30, 10, 5]);
  const check = ()=>{
    const t = state.timerSecondsRemaining;
    if(warnAt.has(t)){
      showToast({ title: getText('timeWarning'), msg: getText('timeWarningMsg', { time: t }), type: t<=5?'error':'warn', timeout: 1200 });
      warnAt.delete(t);
    }
    if(state.timerId) requestAnimationFrame(check);
  };
  requestAnimationFrame(check);
}

// Re-localize dynamic pieces when language changes
window.onWhoBibleLanguageChange = function(lang){
  try{
    // Re-render study list (people) to reflect translated events/occupations
    if(document.getElementById('study-panel') && state.people.length>0){
      renderPeopleList(searchPerson.value || '');
    }
    // Rebuild current question prompt and answer labels if a quiz is active
    if(state.current){
      renderQuestion(state.current);
      // Update answers display text for current choices
      const nodes = Array.from(document.querySelectorAll('#answers .ans'));
      nodes.forEach(node=>{
        const orig = node.dataset.value;
        const q = state.current;
        node.innerText = (typeof translateAnswerForQuestionType==='function') ? translateAnswerForQuestionType(q.type, orig) : orig;
      });
    }
  }catch(_){ /* non-fatal */ }
};

