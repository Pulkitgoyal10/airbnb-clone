export type Listing = { id: number; title: string; location: string; subtitle: string; price: string; rating: string; images: string[]; badge?: string }
const photoIds = ['1600607687939-ce8a6c25118c','1600566753190-17f0baa2a6c3','1600585154340-be6161a56a0c','1600607687920-4e2a09cf159d','1600047509807-ba8f99d2cdde','1600210492486-724fe5c67fb0','1600607688969-a5bfcd646154','1600566753086-00f18fb6b3ea','1600607688969-a5bfcd646154','1600607687920-4e2a09cf159d']
const image=(id:string,seed:number)=>`https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=900&q=85&sig=${seed}`
const cities=['Chandigarh','Mohali','Zirakpur','Gurgaon','Panchkula']
export const listings:Listing[]=Array.from({length:32},(_,i)=>{const location=cities[i%5];return{id:i+1,title:`Home in ${location}`,location,subtitle:`${2+i%3} beds · ${1+i%2} bath${i%3===0?' · Free parking':''}`,price:`₹${(3800+(i*355)%10700).toLocaleString('en-IN')} for 2 nights`,rating:(4.7+(i%4)*.1).toFixed(1),images:Array.from({length:7},(_,j)=>image(photoIds[(i+j)%photoIds.length],i+j)),badge:i%3===0?'Guest favourite':undefined}})
export const destinations=cities
export const originals=[{title:'A stay with a story',image:image(photoIds[3],1)},{title:'Find your happy place',image:image(photoIds[6],2)},{title:'Design-led escapes',image:image(photoIds[1],3)},{title:'Made for slow mornings',image:image(photoIds[5],4)}]
export const footerLinks={Support:['Help Centre','AirCover','Anti-discrimination','Disability support'],Hosting:['Airbnb your home','AirCover for Hosts','Hosting resources','Community forum'],Airbnb:['Newsroom','New features','Careers','Investors']}
export const experiences=listings.slice(0,16).map((l,i)=>({...l,id:100+i,title:['Pottery workshop','Street food walk','Private photo tour','Sunrise yoga'][i%4],price:`from ₹${900+i*120} / guest`,subtitle:'Hosted experience'}))
export const services=listings.slice(16).map((l,i)=>({...l,id:200+i,title:['Chef-prepared dinner','Wellness massage','Personal photographer','Home cooking'][i%4],price:`from ₹${1500+i*180} / guest`,subtitle:'Professional service'}))
export function getListing(id:number){return listings.find(l=>l.id===id)}
export function searchListings(location:string){return location?listings.filter(l=>l.location.toLowerCase().includes(location.toLowerCase())):listings}
