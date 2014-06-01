function ResetAddForm() {
    $('#add-role div.modal-body form div div input#input-role-name').val('');
    $('#add-role div.modal-body form div div textarea#input-role-description').val('');
    $('#add-role div.modal-body form div div input#input-role-deletable').prop('checked', false);
}

function ResetEditForm() {
    $('#edit-role div.modal-body form div div input#input-role-id').val('');
    $('#edit-role div.modal-body form div div input#input-role-name').val('');
    $('#edit-role div.modal-body form div div textarea#input-role-description').val('');
    $('#edit-role div.modal-body form div div input#input-role-deletable').prop('checked', false);
}

function ResetDeleteForm() {
    $('#del-role div.modal-body form div div input#input-role-id').val('');
    $('#del-role div.modal-body form div div input#input-role-name').val('');
    $('#del-role div.modal-body form div div textarea#input-role-description').val('');
    $('#del-role div.modal-body form div div input#input-role-deletable').prop('checked', false);
}

function AddRole(parent, name, description, deletable, callback) {
    AsyncRPC('/admin/roles/add', {
        parent: parent,
        name: name,
        description: description,
        deletable: deletable
    }, callback);
}

function EditRole(id, description, callback) {
    AsyncRPC('/admin/roles/edit', {
        id: id,
        description: description
    }, callback);
}

function DeleteRole(id, callback) {
    AsyncRPC('/admin/roles/delete', {
        id: id
    }, callback);
}

function ProcessRole(roleList) {
    __elsaa_user_roleList = roleList;
    $('#roleListBody').empty();
    $.each(roleList, function (index, item) {
        var deletable = __elsaa_user_perms["Delete Role"] ? (item.DELETABLE == 1 ? false : true) : true;
        var canModify = __elsaa_user_perms["Modify Role"];
        var buttonGroup = '<div class="btn-group btn-group-xs"><button class="btn btn-default modify-button" ' + (canModify ? '' : 'disabled') + ' data-role-id="' + item.ID + '" data-toggle="modify" data-target="#edit-role">Modify</button><button class="btn btn-default delete-button" ' + (deletable ? 'disabled' : '') + ' data-role-id="' + item.ID + '" data-toggle="modify" data-target="#del-role">Delete</button></div>';
        var tr = $('<tr>').append(
            '<td><input type="checkbox" data-role-id="' + item.ID + '"></td><td>' + item.NAME + '</td><td>' + item.DESCRIPTION + '</td><td>' + buttonGroup + '</td>'
        );
        tr.appendTo($('#roleListBody'));
    });
    BindModifyButtons(true);
    BindDeleteButtons(true);
}

function ProceddRolePermissionLinks() {
    $('#rolePermissionsHead').empty();
    $('#rolePermissionsHead').append($('<th>'));
    $.each(__elsaa_permissionList, function (index, item) {
        $('#rolePermissionsHead').append($('<th>').html(item.NAME));
    });
    $('#rolePermissionsBody').empty();
    $.each(__elsaa_user_roleList, function (index, item) {
        __elsaa_user_roleList[index]['permissions'] = SyncRPC('/admin/roles/permissions', {
            roleId: item.ID
        });
        var $row = $('<tr>');
        $row.append($('<td>').html(item.NAME));
        $.each(__elsaa_permissionList, function (innerIndex, innerItem) {
            var linked = _.findWhere(__elsaa_user_roleList[index]['permissions'], {
                ID: innerItem.ID
            }) != undefined;
            $row.append($('<td>').append($('<input>').attr({
                type: 'checkbox',
                'data-permission-id': innerItem.ID,
                'data-role-id': item.ID
            }).prop('checked', linked).addClass('permission-role')));
        });
        $row.appendTo($('#rolePermissionsBody'));
        $('.permission-role').prop('disabled', false);
    });
    $('.permission-role').change(function (e) {
        var $cb = $(e.currentTarget);
        $('.permission-role').prop('disabled', true);
        // console.log($cb.is(':checked'), $cb.data('permissionId'), $cb.data('roleId'));
        AsyncRPC('/admin/roles/permissions/set', {
            permissionId: $cb.data('permissionId'),
            roleId: $cb.data('roleId'),
            link: $cb.is(':checked')
        }, function (result) {
            AsyncRPC('/admin/roles/all', {}, function (result) {
                ProcessRole(result);
                AsyncRPC('/admin/permissions/all', {}, function (result) {
                    window['__elsaa_permissionList'] = result;
                    ProceddRolePermissionLinks();
                });
            });
        });
    });
}

$('#add-role div.modal-footer button#add-role-close-btn').click(function (e) {
    ResetAddForm();
});
$('#add-role div.modal-footer button#add-role-ok-btn').click(function (e) {
    var parent = $('#add-role div.modal-body form div div select#input-role-parent').select2('val');
    var name = $('#add-role div.modal-body form div div input#input-role-name').val();
    var description = $('#add-role div.modal-body form div div textarea#input-role-description').val();
    var deletable = $('#add-role div.modal-body form div div input#input-role-deletable').is(':checked');
    AddRole(parent, name, description, deletable, function (result) {
        if (result == true) {
            AsyncRPC('/admin/roles/all', {}, function (result) {
                ProcessRole(result);
                AsyncRPC('/admin/permissions/all', {}, function (result) {
                    window['__elsaa_permissionList'] = result;
                    ProceddRolePermissionLinks();
                });
            });
        }
    });
    ResetAddForm();
});

$('#edit-role div.modal-footer button#edit-role-close-btn').click(function (e) {
    ResetEditForm();
});
$('#edit-role div.modal-footer button#edit-role-ok-btn').click(function (e) {
    var id = $('#edit-role div.modal-body form div div input#input-role-id').val();
    var description = $('#edit-role div.modal-body form div div textarea#input-role-description').val();
    EditRole(id, description, function (result) {
        if (result == true) {
            AsyncRPC('/admin/roles/all', {}, function (result) {
                ProcessRole(result);
            });
        }
    });
    ResetEditForm();
});

$('#del-role div.modal-footer button#del-role-close-btn').click(function (e) {
    ResetDeleteForm();
});
$('#del-role div.modal-footer button#del-role-ok-btn').click(function (e) {
    var id = $('#del-role div.modal-body form div div input#input-role-id').val();
    DeleteRole(id, function (result) {
        if (result == true) {
            AsyncRPC('/admin/roles/all', {}, function (result) {
                ProcessRole(result);
                AsyncRPC('/admin/permissions/all', {}, function (result) {
                    window['__elsaa_permissionList'] = result;
                    ProceddRolePermissionLinks();
                });
            });
        }
    });
    ResetDeleteForm();
});

function BindModifyButtons(rebind) {
    $('.modify-button').unbind('click').bind({
        'click': function (e) {
            var btn = e.currentTarget;
            if (rebind) {
                $($(btn).data('target')).modal('show');
            }
            var role = $.grep(__elsaa_user_roleList, function (item, index) {
                return item.ID == $(btn).data('roleId');
            })[0];
            $('#edit-role div.modal-body form div div input#input-role-id').val(role.ID);
            $('#edit-role div.modal-body form div div input#input-role-name').val(role.NAME);
            $('#edit-role div.modal-body form div div textarea#input-role-description').val(role.DESCRIPTION);
            $('#edit-role div.modal-body form div div input#input-role-deletable').prop('checked', role.DELETABLE == 1);
        }
    });
}

function BindDeleteButtons(rebind) {
    $('.delete-button').unbind('click').bind({
        'click': function (e) {
            var btn = e.currentTarget;
            if (rebind) {
                $($(btn).data('target')).modal('show');
            }
            var role = $.grep(__elsaa_user_roleList, function (item, index) {
                return item.ID == $(btn).data('roleId');
            })[0];
            $('#del-role div.modal-body form div div input#input-role-id').val(role.ID);
            $('#del-role div.modal-body form div div input#input-role-name').val(role.NAME);
            $('#del-role div.modal-body form div div textarea#input-role-description').val(role.DESCRIPTION);
            $('#del-role div.modal-body form div div input#input-role-deletable').prop('checked', role.DELETABLE == 1);
        }
    });
}

BindModifyButtons();
BindDeleteButtons();

AsyncRPC('/admin/roles/all', {}, function (result) {
    ProcessRole(result);
    AsyncRPC('/admin/permissions/all', {}, function (result) {
        window['__elsaa_permissionList'] = result;
        ProceddRolePermissionLinks();
    });
});
