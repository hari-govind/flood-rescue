var all_entries //to store json from google sheets
var filteredData //data after applying filters
var otherTypes //categories to be included in others

$(document).ready(function() {
    writeJSON()
    .then(() => {
        populateFilters();
        //renderBoxes();
        renderInfo();
        $("#Search").prop('disabled', false);
    })
    $('select').on('change', function(){
        filterChoosenData()
    })
    $('#Search').on('keyup',function(){
        searchData()
    })

})



function getJSON(){
    //returns formatted json from Rescue Ops google sheets
    return new Promise((resolve, reject) => {
    url = 'https://spreadsheets.google.com/feeds/list/1DtMZWjONp6Nh3hUmGXpq3r83OkTV_kKokYdDnTu6vWc/od6/public/values?alt=json'
    fetch(url)
    .then(function(response){
        return response.json()
    })
    .then(function(formattedData){
        entries = formattedData.feed.entry
        resolve(entries);
    })
})
}

function getFilters(){
    //get list of districts, types and status for filtering
    //entries = JSON.parse(localStorage.getItem('allEntries'))
    entries = all_entries
        districts = {};
        types = {};
        condition = {};
        for(i=0;i<entries.length;i++){
            row = entries[i];
            district = row.gsx$district.$t.trim()
            type = row.gsx$typeofservice.$t.trim()
            retrived_status = row.gsx$status.$t.trim()
                condition[retrived_status] = 1
                //Categories NA, Multi-district, and State-wide to be merged under All kerala
                merged_districts = ['NA','Multi-district', 'State-wide','Outside Kerala','All Kerala']
                if (!merged_districts.includes(district)){
                    districts[district] = 1
                }
                //Types that are to be at top and known, these categories will not be automatically inserted
                ignoring_types = ['Ambulance Services', 'Medical', 'Animal Rescue', 'Volunteering',
                'House Cleaning','Electrical Maintenance and Plumbing','Drinking Water','Helpline',
                'Transportation','Collection Point','Other']
                if(!ignoring_types.includes(type)){
                   types[type] = 1
                }
        }
        
        data = {districts: Object.keys(districts).sort(),
                types: ignoring_types,
                other_types: Object.keys(types),
                status: Object.keys(condition).sort()}
        return(data)
}

function writeJSON(){
    //writes downloaded json into --localstorage-- variable
    return new Promise((resolve, reject) => {
    getJSON()
    .then((data)=>{
        //localStorage.setItem('allEntries', JSON.stringify(data));
        all_entries = entries
        resolve()
    })
})
}

function populateFilters(){
    //populates filter dropdowns
    data = getFilters()
    for(i=0;i<data.districts.length;i++){
        $('#DistrictGroup').append(new Option (data.districts[i], data.districts[i]))
    }

    otherTypes = data.other_types
    for(i=0;i<data.types.length;i++){
        $('#Type').append(new Option (data.types[i], data.types[i]))
    }
    /** 
    for(i=0;i<data.status.length;i++){
        $('#Status').append(new Option (data.status[i], data.status[i]))
    }
    */
}

function renderBoxes(){
    var elements = $();
    //entries = JSON.parse(localStorage.getItem('allEntries'))
    entries = all_entries
    renderSelectedData(entries)
}


function renderSelectedData(data){
    $('#data_boxes').empty();
    if(data.length == 0){
        notification_element = `<div class="notification is-info">
        No entries with selected filters found. Kindly try changing the filters.
      </div>`
      $('#data_boxes').append(notification_element)
    } else{
    var elements = $();
    entries = data
    for(i=0;i<entries.length;i++){
        phone_numbers = entries[i].gsx$contactnumber.$t.trim()
        var phone_element = phone_numbers
        try{
            nums = phone_numbers.replace(/ /g,'').split(',') //array of given numbers
            phone_element = ''
            for(j=0;j<nums.length;j++){
                seperator = (j+1==nums.length)?'':' / '
                phone_element = phone_element + `<a href=tel:${nums[j]}>${nums[j]}</a>` + seperator
            }

        } catch(err){
            console.log(err)
        }
        map_link = entries[i].gsx$googlemapslink.$t.trim()
        map_element = map_link == ''? "Map Not Available" : ""
        if(map_link == ''){
            map_element = "Map not available."
        } else {
            map_element = `<div class="media">
                                <figure class="media-left">
                                <p class="image is-64x64">
                                <a href="${map_link}" target="_blank">
                                <img src="images/maps.png">
                                </a>
                                </p>
                                </figure>
                                <div class="media-content">
                                <div class="content">
                                <p>
                                    Click the map icon to view location.
                                </p>
                                </div>
                            </div>`
        }
        elem = `<div class="box">
        <div class="columns">
                <div class="column">
                  <h1 class="title is-4">${i+1}. <span id="district">${entries[i].gsx$district.$t.trim()}</span></h1>
                  <strong>Name: </strong><span id="name">${entries[i].gsx$name.$t.trim()}</span><br>
                  <strong>Contact Number(s): </strong><span id="number">${phone_element}</span><br>
                  <strong>Type of Service: </strong><span id="number">${entries[i].gsx$typeofservice.$t.trim()}</span><br>
                  <strong>Location: </strong> <span id="location">${entries[i].gsx$location.$t.trim()}<span>
                  <br>
                  <strong>Status: </strong> <span id="status">${entries[i].gsx$status.$t.trim()}</span><br>
                  <strong>Date: </strong> <span id="data">${entries[i].gsx$statusason.$t.trim()}</span><br>
                </div>
                <div class="column">
                    <strong>Details: </strong><br>
                    ${entries[i].gsx$details.$t.trim()}
                </div>
                <div class="column">
                  ${map_element}
                </div>
              </div>
</div>`
        elements = elements.add(elem)
        //render 10 boxes at a time
        if(i%10==0||i-entries.length <=10){
            $('#data_boxes').append(elements)
            elements = $()
        }
    }
}
}

function filterChoosenData(){
    selected_district = $('#District').find(':selected').val()
        selected_type = $('#Type').find(':selected').val()
        selected_status = $('#Status').find(':selected').text()
        filteredData = all_entries.filter((x) => {
            merged_districts = ['NA','Multi-district', 'State-wide']
            if(!merged_districts.includes(x.gsx$district.$t.trim())){
                district_filter = selected_district == "All Districts" ? true : x.gsx$district.$t.trim() == selected_district
            } else {
                district_filter = selected_district == "All Kerala"|| selected_district=="All Districts" ? true : false
            }
            if(!otherTypes.includes(x.gsx$typeofservice.$t.trim())){
            type_filter = selected_type == "All Types" ? true : x.gsx$typeofservice.$t.trim() == selected_type
            } else {
                type_filter = selected_type == "Other" || selected_type=="All Types"? true : false
            }
            status_filter = false;
            status_text = x.gsx$status.$t.trim()
            switch(selected_status){
                case "All Status":
                    status_filter = true;
                    break;
                case "Active":
                    acceptable_status = ["Active", "Active.","ACTIVE","active","active.","ACTIVE.", "","verified","Verified"]
                    status_filter =  acceptable_status.includes(status_text)?true : false
                    break;
                case "Inactive":
                    acceptable_status = ["Inactive", "Inactive?", "Not active","NOT ACTIVE"]
                    status_filter =  acceptable_status.includes(status_text)?true : false
                    break;
                case "Others":
                    unacceptable_status = ["Active", "Active.","ACTIVE","active","active.","ACTIVE.",
                    "Inactive", "Inactive?", "Not active","NOT ACTIVE"]
                    if(unacceptable_status.includes(status_text)){
                        status_filter = false
                    } else {
                        status_filter = true
                    }
                    break;
            }
            return district_filter&&status_filter&&type_filter
        })
        renderSelectedData(filteredData)
        $('#Search').val('') //empty search box text
}


function searchData(){
    keyword = $('#Search').val().toLowerCase()
        if(keyword.length>=3){
            $('#search-help').hide()
        data_search = filteredData?filteredData:all_entries //data to be searched
        mathced_data = data_search.filter((x) => {
            details_match = x.gsx$details.$t.toLowerCase().trim().includes(keyword)
            location_match = x.gsx$location.$t.toLowerCase().trim().includes(keyword)
            type_match = x.gsx$typeofservice.$t.toLowerCase().trim().includes(keyword)
            name_match = x.gsx$name.$t.toLowerCase().trim().includes(keyword)
            phone_match = x.gsx$contactnumber.$t.trim().includes(keyword)
            return details_match||location_match||type_match || name_match || phone_match
        })
        renderSelectedData(mathced_data)
    } else {
        $('#search-help').show()
    }
}

function renderInfo(){
    message_elem = `<article class="message is-primary">
        <div class="message-header">
                <p>Welcome to keralafloodrescue.org</p>
        </div>
        <div class="message-body">
                We currently have <strong>${all_entries.length}</strong> entries. You can either search 
                through this entire data by entering your keyword above or narrow down your result using the dropdown fields. 
                Choose your district(or <strong>All Districts</strong> to get complete data) from the above dropdown to get matching results. Search for service/location/details using the search field above.
        </div>
    </article>`
    $('#data_boxes').empty();
    $('#data_boxes').append(message_elem);
}